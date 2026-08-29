import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './main/createMainWindow'
import { configureAppFlags, mainProcessEnvironment } from './main/environment'
import { registerIpcHandlers } from './main/ipcHandlers'
import {
  primeLocalNetworkPermission,
  registerForScreenPermission,
  setExitCleanup,
  stopScreenPermissionWatch,
} from './main/macPermissions'
import { createServerProcessController } from './main/serverProcess'

configureAppFlags()

let win: BrowserWindow | null = null

const serverProcessController = createServerProcessController({
  mainDist: mainProcessEnvironment.mainDist,
  appRoot: mainProcessEnvironment.appRoot,
  rendererDist: mainProcessEnvironment.rendererDist,
})

const openMainWindow = () => {
  if (win && !win.isDestroyed()) {
    if (win.isMinimized()) win.restore()
    win.focus()
    return
  }

  win = createMainWindow({
    currentDir: mainProcessEnvironment.currentDir,
    devServerUrl: mainProcessEnvironment.devServerUrl,
    rendererDist: mainProcessEnvironment.rendererDist,
  })

  win.on('closed', () => {
    win = null
  })
}

let isQuitting = false

app.on('before-quit', () => {
  isQuitting = true
  stopScreenPermissionWatch()
  serverProcessController.stop()
})

app.on('quit', () => {
  serverProcessController.stop()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || isQuitting) {
    serverProcessController.stop()
    app.quit()
  }
})

const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
}

app.on('second-instance', () => {
  openMainWindow()
})

// No macOS o app continua vivo com todas as janelas fechadas. O servidor de
// sinalização também: reabrir a janela não deve reiniciá-lo (isso derrubaria as
// sessões dos alunos já conectados) — apenas religá-lo se ele tiver morrido.
app.on('activate', () => {
  if (!serverProcessController.isRunning()) {
    serverProcessController.start()
  }
  openMainWindow()
})

app.whenReady().then(() => {
  registerIpcHandlers()
  setExitCleanup(() => serverProcessController.stop())
  primeLocalNetworkPermission()
  serverProcessController.start()

  // A janela abre sempre. A permissão de Gravação de Tela é pedida de dentro
  // da interface, por ação do usuário — nunca em intervalo e nunca antes da
  // janela existir, senão o alerta do macOS reaparece sem o app estar visível.
  openMainWindow()

  // Uma única tentativa, para o app existir na lista de Ajustes do Sistema.
  void registerForScreenPermission()
})
