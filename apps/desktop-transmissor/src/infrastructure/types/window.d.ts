export type ScreenAccessStatus =
  | 'granted'
  | 'denied'
  | 'restricted'
  | 'not-determined'
  | 'unknown'

declare global {
  interface Window {
    mirrorAPI?: {
      getDesktopSources: () => Promise<
        Array<{
          id: string
          name: string
          thumbnail: string
        }>
      >
      getNetworkInfo?: () => Promise<unknown>
      getScreenAccessStatus?: () => Promise<ScreenAccessStatus>
      requestScreenAccess?: (openSettings: boolean) => Promise<ScreenAccessStatus>
      restartApp?: () => Promise<void>
    }
    ipcRenderer?: {
      on: (channel: string, listener: (...args: any[]) => void) => unknown
      off: (channel: string, listener: (...args: any[]) => void) => unknown
      send: (channel: string, ...args: any[]) => unknown
      invoke: (channel: string, ...args: any[]) => Promise<any>
      getDesktopSources?: () => Promise<any>
    }
  }
}

export {}

