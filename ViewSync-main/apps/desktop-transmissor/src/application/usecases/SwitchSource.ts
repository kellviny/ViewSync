import type { ProducerPort } from '../ports/ProducerPort'
import type { ScreenCapturePort } from '../ports/ScreenCapturePort'

export const switchSource = async (deps: {
  screenCapture: ScreenCapturePort
  producer: ProducerPort
  params: {
    sourceId: string
    fps: number
  }
  localStream: MediaStream | null
}) => {
  const stream = await deps.screenCapture.capture(deps.params.sourceId, deps.params.fps)
  const track = stream.getVideoTracks()[0]
  if (!track) throw new Error('No video track')

  await deps.producer.replaceTrack(track)

  deps.localStream?.getTracks().forEach((t) => t.stop())

  return stream
}

