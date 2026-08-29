import { app, dialog } from 'electron'
import { fork, type ChildProcess } from 'node:child_process'
import net from 'node:net'
import path from 'node:path'

type ServerProcessParams = {
  mainDist: string
  appRoot: string
  rendererDist: string
  signalingPort?: number
}

type ServerProcessController = {
  start: () => void
  stop: () => void
  isRunning: () => boolean
}

const isPortListening = (port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })

    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })

    socket.once('error', () => {
      resolve(false)
    })
  })
}

export const createServerProcessController = ({
  mainDist,
  appRoot,
  rendererDist,
  signalingPort = 3000,
}: ServerProcessParams): ServerProcessController => {
  let serverProcess: ChildProcess | null = null

  const stop = () => {
    if (!serverProcess) return

    const child = serverProcess
    serverProcess = null
    child.removeAllListeners()
    child.kill('SIGTERM')

    // Os workers nativos do Mediasoup são netos deste processo e nem sempre
    // caem com o SIGTERM. Se sobrarem, a porta 3000 continua ocupada e o app
    // só volta a funcionar depois de fechar e abrir de novo — daí o SIGKILL.
    const forceKill = setTimeout(() => {
      try {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
      } catch {
        /* noop */
      }
    }, 1500)

    forceKill.unref?.()
  }

  const isRunning = () => serverProcess !== null

  const start = () => {
    if (serverProcess) return

    const serverPath = path.join(mainDist, 'server.js')

    serverProcess = fork(serverPath, [], {
      env: {
        ...process.env,
        RENDERER_DIST: rendererDist,
        APP_ROOT: appRoot,
        IS_PACKAGED: app.isPackaged.toString(),
        RESOURCES_PATH: process.resourcesPath,
      },
      stdio: 'inherit',
    })

    serverProcess.on('error', () => {
      serverProcess = null
    })

    serverProcess.on('exit', (code) => {
      serverProcess = null
      if (code === 0 || code === null) return

      void (async () => {
        const signalingAlreadyRunning = await isPortListening(signalingPort)
        if (signalingAlreadyRunning) return

        if (app.isPackaged) {
          dialog.showErrorBox(
            'Erro Crítico no Servidor',
            `O motor de vídeo (Mediasoup) falhou ao iniciar (Código: ${code}).\nIsso geralmente ocorre se o executável do worker ficou preso dentro do app.asar.`
          )
        }
      })()
    })
  }

  return {
    start,
    stop,
    isRunning,
  }
}