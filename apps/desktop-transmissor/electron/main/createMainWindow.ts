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
    title: 'ViewSync Studio',
    icon: path.join(process.env.VITE_PUBLIC || '', process.platform === 'win32' ? 'ico.ico' : 'ico.icns'),
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(currentDir, 'preload.js'),
      backgroundThrottling: false,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  win.setMenuBarVisibility(false)

  if (devServerUrl) {
    void win.loadURL(devServerUrl)
  } else {
    void win.loadFile(path.join(rendererDist, 'index.html'))
  }

  return win
}