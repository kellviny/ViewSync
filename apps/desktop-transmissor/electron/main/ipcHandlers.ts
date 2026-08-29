import { BrowserWindow, desktopCapturer, ipcMain } from 'electron'
import { getScreenAccessStatus, requestScreenAccess, restartApp } from './macPermissions'

export const registerIpcHandlers = (): void => {
  ipcMain.removeHandler('get-desktop-sources')
  ipcMain.removeHandler('get-network-info')
  ipcMain.removeHandler('set-content-protection')
  ipcMain.removeHandler('get-screen-access-status')
  ipcMain.removeHandler('request-screen-access')
  ipcMain.removeHandler('restart-app')

  ipcMain.handle('get-desktop-sources', async () => {
    // No macOS, cada chamada a desktopCapturer.getSources() sem permissão faz o
    // sistema exibir de novo o alerta de Gravação de Tela. Como o renderer
    // atualiza a lista de fontes em intervalo, isso virava um alerta a cada
    // poucos segundos, impossível de dispensar. Só consultamos as fontes
    // quando a permissão já existe; o pedido acontece uma única vez, por ação
    // explícita do usuário, via 'request-screen-access'.
    if (getScreenAccessStatus() !== 'granted') return []

    try {
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        fetchWindowIcons: true,
      })

      return sources.map((source) => ({
        id: source.id,
        name: source.name,
        thumbnail: source.thumbnail.toDataURL(),
      }))
    } catch {
      return []
    }
  })

  ipcMain.handle('get-screen-access-status', () => getScreenAccessStatus())

  ipcMain.handle('request-screen-access', async (_event, openSettings?: boolean) => {
    return requestScreenAccess(Boolean(openSettings))
  })

  ipcMain.handle('restart-app', () => {
    restartApp()
  })

  ipcMain.handle('get-network-info', async () => {
    return {}
  })

  ipcMain.handle('set-content-protection', async (_event, enable: boolean) => {
    try {
      const windows = BrowserWindow.getAllWindows()
      for (const win of windows) {
        win.setContentProtection(Boolean(enable))
      }
      return true
    } catch {
      return false
    }
  })

}
