import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'node:path'
import {
  APP_ROOT,
  HTTP_PORT,
  IS_PACKAGED,
  RENDERER_DIST,
  RESOURCES_PATH,
  RTC_MAX_PORT,
  RTC_MIN_PORT,
} from './signaling/config'
import {
  getAllNetworkInterfaces,
  getInterfaceSignature,
  getNetworkDetails,
  invalidateSsidCache,
} from './signaling/network'
import { RoomSessionState } from './signaling/RoomSessionState'
import { MediasoupEngine } from './signaling/MediasoupEngine'
import type {
  ConnectWebRtcTransportPayload,
  ConsumePayload,
  HostStartStreamPayload,
  ProducePayload,
  ResumePayload,
  ViewerJoinPayload,
} from './signaling/types'

const ENROLLMENT_PATTERN = /^(\d{4})(\d{3})([A-Z]{4})(\d{4})$/
const SUSPICIOUS_NAME_PATTERN = /\b(teste|test|asdf|qwerty|admin|usuario|nome|zoado)\b/i

const normalizeName = (name: string): string => name.replace(/\s+/g, ' ').trim()

const isValidEnrollment = (input: string): boolean => {
  if (!input) return false
  if (input.startsWith('VIS-')) return true
  const match = input.match(ENROLLMENT_PATTERN)
  if (!match) return false

  const enrollmentYear = Number(match[1])
  const currentYear = new Date().getFullYear()
  return enrollmentYear >= 1900 && enrollmentYear <= currentYear
}

const isValidName = (input: string): boolean => {
  if (input.length < 3) return false
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(input)) return false
  if (!/[AEIOUaeiouÀ-ÖØ-öø-ÿ]/.test(input)) return false
  if (/(.)\1{3,}/.test(input)) return false
  if (SUSPICIOUS_NAME_PATTERN.test(input)) return false
  return true
}

// Quando o processo principal morre, o canal IPC do fork fecha. Sem isto o
// servidor vira órfão segurando a porta 3000, e a instância seguinte não
// consegue subir — era a causa do app ficar "conectando" após um reinício.
process.on('disconnect', () => process.exit(0))

const startServer = async () => {
  const mediasoupEngine = new MediasoupEngine()
  const roomSessionState = new RoomSessionState()

  await mediasoupEngine.initialize(RTC_MIN_PORT, RTC_MAX_PORT)
  void getNetworkDetails().catch(() => undefined)

  const expressApp = express()
  const httpServer = createServer(expressApp)

  const io = new Server(httpServer, {
    cors: { origin: '*' },
    perMessageDeflate: false,
    maxHttpBufferSize: 1e7
  })

  if (IS_PACKAGED) {
    // Produção: serve o viewer buildado que está dentro do bundle do app
    const viewerPath = path.join(RESOURCES_PATH, 'viewer')
    expressApp.get('/admin', (_req, res) => res.sendFile(path.join(viewerPath, 'admin.html')))
    expressApp.get('/admin/', (_req, res) => res.sendFile(path.join(viewerPath, 'admin.html')))
    expressApp.use(express.static(viewerPath, { extensions: ['html'] }))
  } else {
    // Dev: o viewer-web/out pode não existir ainda (não buildado).
    // Verifica se existe; se existir, serve estático. Caso contrário, faz proxy
    // para o Vite dev server do viewer-web (porta 5174) se estiver rodando,
    // ou redireciona para a porta padrão do Next.js (3001).
    const outPath = path.join(APP_ROOT, '../viewer-web/out')
    const fs = await import('node:fs')
    if (fs.existsSync(outPath)) {
      const setHeaders = (res: any, path: string) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
          res.setHeader('Pragma', 'no-cache')
          res.setHeader('Expires', '0')
        }
      }

      expressApp.get('/admin', (_req, res) => {
        setHeaders(res, 'admin.html')
        res.sendFile(path.join(outPath, 'admin.html'))
      })
      expressApp.get('/admin/', (_req, res) => {
        setHeaders(res, 'admin.html')
        res.sendFile(path.join(outPath, 'admin.html'))
      })
      expressApp.get('/', (_req, res) => {
        setHeaders(res, 'index.html')
        res.sendFile(path.join(outPath, 'index.html'))
      })
      expressApp.use(express.static(outPath, { extensions: ['html'], setHeaders }))
    } else {
      // Viewer não buildado em dev: exibe mensagem amigável
      expressApp.get('*', (_req, res) => {
        res.send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head><meta charset="UTF-8"><title>ViewSync – Dev Mode</title>
          <style>body{font-family:monospace;background:#0a0a0f;color:#a0a0b0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:16px;}</style>
          </head>
          <body>
            <p style="color:#6366F1;font-size:1.2em;font-weight:bold;">ViewSync — Modo Dev</p>
            <p>Viewer web não buildado. Rode em outro terminal:</p>
            <pre style="background:#111;padding:12px;border-radius:8px;color:#22D3EE;">cd apps/viewer-web && npm run build</pre>
            <p style="font-size:0.8em;color:#555;">Ou acesse o Next.js diretamente se estiver rodando.</p>
          </body>
          </html>
        `)
      })
    }
  }
  expressApp.use('/studio', express.static(RENDERER_DIST))

  const broadcastState = () => {
    const state = roomSessionState.buildPublicState()
    io.emit('room:state_update', state)
  }

  let currentNet: { ip: string; network: string } = await getNetworkDetails()

  const buildServerInfo = () => ({
    ip: currentNet.ip,
    network: currentNet.network,
    port: HTTP_PORT,
    interfaces: getAllNetworkInterfaces(),
    adminToken: roomSessionState.getAdminToken(),
  })

  io.on('connection', async (socket) => {
    roomSessionState.onSocketConnected(socket.id)

    socket.emit('server:info', buildServerInfo())
    broadcastState()

    socket.on('disconnect', () => {
      const identity = roomSessionState.getViewerIdentity(socket.id)
      if (identity) {
        console.info(
          `[Viewer saiu] matrícula=${identity.enrollment} nome="${identity.name}" socket=${socket.id}`
        )
      }

      roomSessionState.onSocketDisconnect(socket.id)
      broadcastState()
    })

    // Permite ao host repedir os dados da sala a qualquer momento — cobre
    // reconexão e qualquer corrida entre o 'connection' do servidor e o
    // registro do listener no renderer.
    socket.on('host:request_info', () => {
      socket.emit('server:info', buildServerInfo())
    })

    socket.on('host:start_stream', (payload: HostStartStreamPayload, callback?: (res: { adminToken: string }) => void) => {
      roomSessionState.onHostStartStream(socket.id, payload)
      if (callback) {
        callback({ adminToken: roomSessionState.getAdminToken() })
      }
      broadcastState()
    })

    socket.on('host:stop_stream', () => {
      const stopResult = roomSessionState.onHostStopStream(socket.id)
      if (stopResult) {
        if (stopResult.report) {
          socket.emit('host:stream_report', stopResult.report)
        }
        // resetRoom() gera um adminToken novo: sem reemitir, o host ficaria
        // com o token antigo (ou nenhum) até reconectar.
        io.emit('server:info', buildServerInfo())
        broadcastState()
      }
    })

    socket.on('host:set_network', (payload: { ip: string; network: string }) => {
      // Allow only if we are not streaming
      if (roomSessionState.buildPublicState().isStreaming) return
      currentNet = payload
      io.emit('server:info', {
        ip: currentNet.ip,
        network: currentNet.network,
        port: HTTP_PORT,
        interfaces: getAllNetworkInterfaces()
      })
    })

    socket.on('admin:join', (payload: { token: string }, callback) => {
      if (roomSessionState.getAdminToken() === payload.token) {
        callback({ success: true, state: roomSessionState.buildPublicState() })
      } else {
        callback({ success: false, error: 'Token inválido ou sala não iniciada.' })
      }
    })

    socket.on('viewer:join', (payload: ViewerJoinPayload) => {
      const enrollment = payload.viewerEnrollment?.trim().toUpperCase() || ''
      const name = normalizeName(payload.viewerName || '')

      if (!isValidEnrollment(enrollment)) {
        socket.emit('error', 'Matrícula inválida. Use o padrão AAAA999LLLL9999.')
        return
      }

      if (!isValidName(name)) {
        socket.emit('error', 'Nome inválido. Informe seu nome real para continuar.')
        return
      }

      if (!roomSessionState.isViewerAuthorized(payload)) {
        socket.emit('error', 'Senha incorreta.')
        return
      }

      roomSessionState.registerViewerIdentity(socket.id, enrollment, name)

      console.info(
        `[Viewer entrou] matrícula=${enrollment} nome="${name}" socket=${socket.id}`
      )

      socket.emit('viewer:authorized')
      broadcastState()
    })

    socket.on('viewer:visibility_change', async (isVisible) => {
      if (roomSessionState.isHostSocket(socket.id)) return

      try {
        roomSessionState.setViewerVisibility(socket.id, Boolean(isVisible))
        await mediasoupEngine.syncViewerVisibility(socket.id, Boolean(isVisible))
        broadcastState()
      } catch {}
    })

    socket.on('mediasoup:getRouterRtpCapabilities', (callback) =>
      callback(mediasoupEngine.getRouterRtpCapabilities())
    )

    socket.on('mediasoup:createWebRtcTransport', async (_: { direction?: string }, callback) => {
      const transport = await mediasoupEngine.createWebRtcTransport(currentNet.ip)
      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      })
    })

    socket.on('mediasoup:connectWebRtcTransport', async (
      payload: ConnectWebRtcTransportPayload,
      callback: () => void
    ) => {
      await mediasoupEngine.connectWebRtcTransport(payload)
      callback()
    })

    socket.on('mediasoup:produce', async (
      payload: ProducePayload,
      callback: (p: { id: string }) => void
    ) => {
      const producerId = await mediasoupEngine.produce(payload)
      if (!producerId) return

      callback({ id: producerId })
      socket.broadcast.emit('mediasoup:newProducer', { producerId })
    })

    socket.on('mediasoup:consume', async (
      payload: ConsumePayload,
      callback: (p: object) => void
    ) => {
      const consumer = await mediasoupEngine.consume(socket.id, payload)
      if (!consumer) return
      callback(consumer)
    })

    socket.on('mediasoup:resume', async (
      payload: ResumePayload,
      callback: () => void
    ) => {
      await mediasoupEngine.resume(payload)
      callback()
    })
  })

  // ── Monitor Contínuo de Mudança de Rede (Wi-Fi / Ethernet / IP) ──
  // O tick é barato: compara apenas a assinatura das interfaces IPv4 vinda do
  // `os` (sem spawn de processo). O SSID — que no macOS/Windows exige executar
  // um binário do sistema — só é reconsultado quando a assinatura muda ou a
  // cada SSID_RECHECK_TICKS ticks, para pegar troca de Wi-Fi que mantém o IP.
  const NETWORK_TICK_MS = 2000
  const SSID_RECHECK_TICKS = 5 // ~10s

  let lastSignature = getInterfaceSignature()
  let ticksSinceSsidCheck = 0
  let networkTickBusy = false

  const emitNetwork = (net: { ip: string; network: string }) => {
    io.emit('server:info', {
      ip: net.ip,
      network: net.network,
      port: HTTP_PORT,
      interfaces: getAllNetworkInterfaces(),
      adminToken: roomSessionState.getAdminToken(),
    })
  }

  setInterval(async () => {
    if (networkTickBusy) return
    networkTickBusy = true

    try {
      if (roomSessionState.buildPublicState().isStreaming) return

      const signature = getInterfaceSignature()
      const signatureChanged = signature !== lastSignature
      ticksSinceSsidCheck += 1

      const shouldRecheckSsid = signatureChanged || ticksSinceSsidCheck >= SSID_RECHECK_TICKS
      if (!signatureChanged && !shouldRecheckSsid) return

      if (signatureChanged) {
        lastSignature = signature
        invalidateSsidCache()
      }
      if (shouldRecheckSsid) ticksSinceSsidCheck = 0

      const freshNet = await getNetworkDetails(shouldRecheckSsid)

      if (freshNet.ip !== currentNet.ip || freshNet.network !== currentNet.network) {
        console.info(
          `[Rede alterada] ${currentNet.ip} (${currentNet.network}) -> ${freshNet.ip} (${freshNet.network})`
        )
        currentNet = freshNet
        emitNetwork(currentNet)
      }
    } catch {
      // Detecção de rede é best-effort: nunca derruba o servidor.
    } finally {
      networkTickBusy = false
    }
  }, NETWORK_TICK_MS)

  httpServer.listen(HTTP_PORT, '0.0.0.0')
}

startServer()