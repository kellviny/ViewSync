import { useEffect, useMemo, useRef, useState } from 'react'
import type { DesktopSource } from '../../domain/models/DesktopSource'
import type { RoomState } from '../../domain/models/RoomState'
import { refreshSources } from '../../application/usecases/RefreshSources'
import { startStream } from '../../application/usecases/StartStream'
import { stopStream } from '../../application/usecases/StopStream'
import { switchSource } from '../../application/usecases/SwitchSource'
import { createDesktopTransmissorCompositionRoot } from '../../app/compositionRoot'
import type { ScreenAccessStatus } from '../../infrastructure/types/window'

export const useTransmissorController = () => {
  const deps = useMemo(() => createDesktopTransmissorCompositionRoot(), [])

  const [sources, setSources] = useState<DesktopSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [password, setPassword] = useState('')
  const [fps, setFps] = useState(30)
  const [serverIp, setServerIp] = useState('Carregando...')
  const [serverPort, setServerPort] = useState(3000)
  const [networkName, setNetworkName] = useState('Detectando...')
  const [networkInterfaces, setNetworkInterfaces] = useState<{ name: string; ip: string }[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [roomState, setRoomState] = useState<RoomState>({ connectedCount: 0, activeViewersCount: 0, viewers: [] })
  const [isConnected, setIsConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [streamReport, setStreamReport] = useState<any | null>(null)
  const [screenAccess, setScreenAccess] = useState<ScreenAccessStatus>('granted')

  const videoRef = useRef<HTMLVideoElement>(null)
  const isStartingRef = useRef(false)
  const privacyTrackRef = useRef<MediaStreamTrack | null>(null)

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
      videoRef.current.play().catch(() => {})
    }
  }, [localStream, isStreaming])

  const doRefreshSources = async () => {
    try {
      const next = await refreshSources({ desktopSources: deps.desktopSources })
      setSources(next || [])
      if (next && next.length > 0 && selectedSource === null) {
        setSelectedSource(next[0].id)
      }
    } catch {}
  }

  useEffect(() => {
    const unsubConnect = deps.signaling.onConnectChange((connected) => {
      setIsConnected(connected)
      // Ao conectar, pede os dados da sala: garante o adminToken mesmo se o
      // 'server:info' inicial tiver chegado antes deste listener existir.
      if (connected) deps.signaling.requestServerInfo?.()
    })
    const unsubServerInfo = deps.signaling.onServerInfo((info) => {
      setServerIp(info.ip)
      setServerPort(info.port)
      setNetworkName(info.network || 'Rede Local')
      setNetworkInterfaces(info.interfaces || [])
      if (info.adminToken) setAdminToken(info.adminToken)
    })
    const unsubRoomState = deps.signaling.onRoomState(setRoomState)
    let unsubReport: (() => void) | undefined
    if (deps.signaling.onStreamReport) {
      unsubReport = deps.signaling.onStreamReport((report: any) => {
        setStreamReport(report)
      })
    }

    // A lista de fontes só é consultada com permissão concedida: no macOS cada
    // consulta sem permissão faz o alerta de Gravação de Tela reaparecer, e em
    // intervalo isso vira um alerta impossível de dispensar.
    let sourceInterval: number | undefined

    const startSourcePolling = () => {
      if (sourceInterval !== undefined) return
      doRefreshSources()
      sourceInterval = window.setInterval(() => {
        if (!isStreaming && !isStartingRef.current) {
          doRefreshSources()
        }
      }, 5000)
    }

    void (async () => {
      const status = (await window.mirrorAPI?.getScreenAccessStatus?.()) ?? 'granted'
      setScreenAccess(status)
      if (status === 'granted') startSourcePolling()
    })()

    return () => {
      unsubConnect()
      unsubServerInfo()
      unsubRoomState()
      if (unsubReport) unsubReport()
      deps.signaling.dispose()
      if (sourceInterval !== undefined) window.clearInterval(sourceInterval)
    }
  }, [deps, isStreaming])

  useEffect(() => {
    if (isStreaming && selectedSource && !isStartingRef.current) {
      switchSource({
        screenCapture: deps.screenCapture,
        producer: deps.producer,
        params: { sourceId: selectedSource, fps },
        localStream,
      })
        .then((stream) => setLocalStream(stream))
        .catch(() => {})
    }
  }, [selectedSource])

  /**
   * Pede a permissão de tela ao macOS. Só é chamada por clique do usuário —
   * é a única chamada do app capaz de exibir o alerta do sistema.
   */
  const requestScreenAccess = async (openSettings: boolean) => {
    const status = (await window.mirrorAPI?.requestScreenAccess?.(openSettings)) ?? 'granted'
    setScreenAccess(status)
    if (status === 'granted') doRefreshSources()
    return status
  }

  /**
   * Substitui o vídeo enviado aos alunos por uma tela de espera.
   *
   * Usado enquanto o QR de admin está aberto: o link de admin carrega o token
   * da sala, então não pode aparecer na transmissão. Depender de
   * setContentProtection não basta — ele esconde a janela da captura de
   * janela, mas não da captura de tela cheia, que é justamente onde o QR
   * vazava. Trocando a track na origem, não há caminho pelo qual o QR chegue
   * a um aluno.
   */
  const setPrivacyShield = async (enabled: boolean) => {
    if (!isStreaming) return

    try {
      if (enabled) {
        if (privacyTrackRef.current) return

        const canvas = document.createElement('canvas')
        canvas.width = 1280
        canvas.height = 720
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.fillStyle = '#0b0f19'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = '#e2e8f0'
          ctx.font = 'bold 48px system-ui, sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('Transmissão pausada', canvas.width / 2, canvas.height / 2 - 10)
          ctx.fillStyle = '#94a3b8'
          ctx.font = '28px system-ui, sans-serif'
          ctx.fillText('Aguarde o professor retomar', canvas.width / 2, canvas.height / 2 + 50)
        }

        // 1 fps basta: a imagem é estática e economiza banda da sala.
        const track = canvas.captureStream(1).getVideoTracks()[0]
        if (!track) return

        privacyTrackRef.current = track
        await deps.producer.replaceTrack(track)
        return
      }

      const realTrack = localStream?.getVideoTracks()[0]
      if (realTrack) await deps.producer.replaceTrack(realTrack)

      privacyTrackRef.current?.stop()
      privacyTrackRef.current = null
    } catch {
      // Falha ao blindar não pode derrubar a transmissão.
    }
  }

  const restartApp = () => {
    void window.mirrorAPI?.restartApp?.()
  }

  const copyUrl = async () => {
    try {
      await deps.clipboard.copy(`http://${serverIp}:${serverPort}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const onStartStream = async () => {
    if (!selectedSource || isStartingRef.current) return

    isStartingRef.current = true
    setIsStarting(true)

    try {
      const effectivePassword = import.meta.env.VITE_APP_MODE === 'institutional' ? '' : password
      const { stream, adminToken } = await startStream({
        signaling: deps.signaling,
        screenCapture: deps.screenCapture,
        producer: deps.producer,
        params: { sourceId: selectedSource, fps, password: effectivePassword },
      })

      setLocalStream(stream)
      setAdminToken(adminToken)
      setIsStreaming(true)
    } catch {
      alert('Erro ao iniciar captura. Verifique as permissões.')
    } finally {
      isStartingRef.current = false
      setIsStarting(false)
    }
  }

  const onStopStream = () => {
    stopStream({ signaling: deps.signaling, producer: deps.producer, localStream })
    setLocalStream(null)
    setAdminToken(null)
    setIsStreaming(false)
  }

  const onSetNetwork = (ip: string, network: string) => {
    deps.signaling.hostSetNetwork?.(ip, network)
  }

  return {
    copied,
    copyUrl,
    fps,
    isConnected,
    isStarting,
    isStreaming,
    localStream,
    networkName,
    networkInterfaces,
    adminToken,
    streamReport,
    setStreamReport,
    onStartStream,
    onStopStream,
    setPrivacyShield,
    onSetNetwork,
    password,
    roomState,
    screenAccess,
    requestScreenAccess,
    restartApp,
    selectedSource,
    serverIp,
    serverPort,
    setFps,
    setPassword,
    setSelectedSource,
    sources,
    videoRef,
  }
}

