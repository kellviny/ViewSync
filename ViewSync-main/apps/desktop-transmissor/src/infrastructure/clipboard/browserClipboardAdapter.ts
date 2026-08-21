import type { ClipboardPort } from '../../application/ports/ClipboardPort'

export const createBrowserClipboardAdapter = (): ClipboardPort => {
  return {
    copy: async (text) => {
      await navigator.clipboard.writeText(text)
    },
  }
}

