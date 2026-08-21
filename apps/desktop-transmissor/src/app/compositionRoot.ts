import { createBrowserClipboardAdapter } from '../infrastructure/clipboard/browserClipboardAdapter'
import { createElectronDesktopSourcesAdapter } from '../infrastructure/desktop/electronDesktopSourcesAdapter'
import { createScreenCaptureAdapter } from '../infrastructure/desktop/screenCaptureAdapter'
import { createSocketIoSignalingClient } from '../infrastructure/signaling/socketIoSignalingClient'
import { createMediasoupProducerAdapter } from '../infrastructure/streaming/mediasoupProducerAdapter'

export const createDesktopTransmissorCompositionRoot = () => {
  const signaling = createSocketIoSignalingClient('http://localhost:3000')
  const producer = createMediasoupProducerAdapter(signaling)
  const desktopSources = createElectronDesktopSourcesAdapter()
  const screenCapture = createScreenCaptureAdapter()
  const clipboard = createBrowserClipboardAdapter()

  return {
    clipboard,
    desktopSources,
    producer,
    screenCapture,
    signaling,
  }
}

