import type { ProducerPort } from '../ports/ProducerPort'
import type { ScreenCapturePort } from '../ports/ScreenCapturePort'
import type { SignalingPort } from '../ports/SignalingPort'
import type { StreamConfig } from '../../domain/models/StreamConfig'

export const startStream = async (deps: {
  signaling: SignalingPort
  screenCapture: ScreenCapturePort
  producer: ProducerPort
  params: {
    sourceId: string
    fps: number
    password?: string
  }
}) => {
  const stream = await deps.screenCapture.capture(deps.params.sourceId, deps.params.fps)
  const track = stream.getVideoTracks()[0]
  if (!track) throw new Error('No video track')

  const rtpCapabilities = await deps.signaling.getRouterRtpCapabilities()
  const transportParams = await deps.signaling.createWebRtcTransport('send')

  const { producerId } = await deps.producer.startProducing({ rtpCapabilities, transportParams, track })

  const config: StreamConfig = {
    fps: deps.params.fps,
    hasPassword: !!deps.params.password && deps.params.password.length > 0,
    producerId,
  }

  const { adminToken } = await deps.signaling.hostStartStream(config, deps.params.password || '')

  return { stream, producerId, adminToken }
}

