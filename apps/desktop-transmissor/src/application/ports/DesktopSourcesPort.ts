import type { DesktopSource } from '../../domain/models/DesktopSource'

export type DesktopSourcesPort = {
  listSources: () => Promise<DesktopSource[]>
}

