import { BrowserWindow, desktopCapturer, ipcMain } from 'electron'

export const registerIpcHandlers = (): void => {
  ipcMain.removeHandler('get-desktop-sources')
  ipcMain.removeHandler('get-network-info')
  ipcMain.removeHandler('set-content-protection')

  ipcMain.handle('get-desktop-sources', async () => {
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