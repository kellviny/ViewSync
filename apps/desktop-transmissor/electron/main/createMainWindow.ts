import { BrowserWindow } from 'electron'
import path from 'node:path'

type CreateMainWindowParams = {
  currentDir: string
  devServerUrl?: string
  rendererDist: string
}

export const createMainWindow = ({
  currentDir,
  devServerUrl,
  rendererDist,
}: CreateMainWindowParams): BrowserWindow => {
  const win = new BrowserWindow({
    title: 'Lan View',
    icon: path.join(process.env.VITE_PUBLIC || '', process.platform === 'win32' ? 'ico.ico' : 'ico.icns'),
    width: 1200,
    height: 800,
    // Evita o flash branco enquanto o renderer carrega — no macOS a janela
    // vazia dava a impressão de que o app não tinha aberto.
    show: false,
    backgroundColor: '#0b0f19',
    webPreferences: {
      preload: path.join(currentDir, 'preload.js'),
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  win.setMenuBarVisibility(false)

  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  if (devServerUrl) {
    void win.loadURL(devServerUrl)
  } else {
    void win.loadFile(path.join(rendererDist, 'index.html'))
  }

  return win
}