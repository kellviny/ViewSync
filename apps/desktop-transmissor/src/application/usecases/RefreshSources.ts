import type { DesktopSourcesPort } from '../ports/DesktopSourcesPort'

export const refreshSources = async (deps: { desktopSources: DesktopSourcesPort }) => {
  return deps.desktopSources.listSources()
}

