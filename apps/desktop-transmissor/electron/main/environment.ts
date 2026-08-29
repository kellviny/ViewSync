import { app } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

export const configureAppFlags = (): void => {
  const isMac = process.platform === 'darwin'

  // No Windows/Linux a aceleração de hardware causava artefatos e travas na
  // captura de tela. No macOS ela é justamente o que habilita o encode por
  // VideoToolbox — desligá-la derruba o FPS e deixa a captura instável, então
  // aqui ela permanece ligada.
  if (!isMac) {
    app.disableHardwareAcceleration()
    app.commandLine.appendSwitch('disable-gpu')
    app.commandLine.appendSwitch('disable-software-rasterizer')
  }

  app.commandLine.appendSwitch('enable-features', 'DesktopCaptureExtensions')

  // Windows Graphics Capture: flags exclusivas do Windows.
  if (process.platform === 'win32') {
    app.commandLine.appendSwitch(
      'disable-features',
      'WebRtcAllowWgcScreenCapturer,WebRtcAllowWgcWindowCapturer,WebRtcAllowWgcCapturer'
    )
  }

  app.commandLine.appendSwitch('log-level', '3')
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
}

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(CURRENT_DIR, '..')

const appRoot = process.env.APP_ROOT
const devServerUrl = process.env.VITE_DEV_SERVER_URL
const rendererDist = path.join(appRoot, 'dist')

process.env.VITE_PUBLIC = devServerUrl ? path.join(appRoot, 'public') : rendererDist

export const mainProcessEnvironment = {
  currentDir: CURRENT_DIR,
  appRoot,
  mainDist: path.join(appRoot, 'dist-electron'),
  rendererDist,
  devServerUrl,
} as const