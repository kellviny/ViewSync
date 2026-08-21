import type { DesktopSourcesPort } from '../../application/ports/DesktopSourcesPort'
import type { DesktopSource } from '../../domain/models/DesktopSource'

export const createElectronDesktopSourcesAdapter = (): DesktopSourcesPort => {
  return {
    listSources: async () => {
      const api = window.mirrorAPI
      if (!api?.getDesktopSources) return []

      const sources = await api.getDesktopSources()
      return (sources ?? []) as DesktopSource[]
    },
  }
}

