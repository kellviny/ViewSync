import { createSocketIOSignalingAdapter } from '../infrastructure/signaling/SocketIOSignalingAdapter'
import { createMediasoupConsumerAdapter } from '../infrastructure/streaming/MediasoupConsumerAdapter'
import type { SignalingPort } from './ports/SignalingPort'
import type { ConsumerPort } from './ports/ConsumerPort'

export type ViewerDeps = {
  signaling: SignalingPort
  consumer: ConsumerPort
}

export const createViewerCompositionRoot = (): ViewerDeps => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:'
  const serverUrl = `${protocol}//${hostname}:3000`
  const signaling = createSocketIOSignalingAdapter(serverUrl)
  const consumer = createMediasoupConsumerAdapter(signaling)
  return { signaling, consumer }
}
