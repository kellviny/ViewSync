const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('mirrorAPI', {
  getDesktopSources: () => ipcRenderer.invoke('get-desktop-sources'),
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  getScreenAccessStatus: () => ipcRenderer.invoke('get-screen-access-status'),
  requestScreenAccess: (openSettings: boolean) =>
    ipcRenderer.invoke('request-screen-access', openSettings),
  restartApp: () => ipcRenderer.invoke('restart-app')
})
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: any[]) => void) {
    const wrappedListener = (_event: any, ...args: any[]) => listener(...args)
    ipcRenderer.on(channel, wrappedListener)
    return () => ipcRenderer.removeListener(channel, wrappedListener)
  },
  off(channel: string, listener: (...args: any[]) => void) {
    ipcRenderer.removeListener(channel, listener)
  },
  send(channel: string, ...args: any[]) {
    ipcRenderer.send(channel, ...args)
  },
  invoke(channel: string, ...args: any[]) {
    return ipcRenderer.invoke(channel, ...args)
  },
})