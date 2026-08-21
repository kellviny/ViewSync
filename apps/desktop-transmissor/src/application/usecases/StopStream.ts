import type { ProducerPort } from '../ports/ProducerPort'
import type { SignalingPort } from '../ports/SignalingPort'

export const stopStream = (deps: {
  signaling: SignalingPort
  producer: ProducerPort
  localStream: MediaStream | null
}) => {
  deps.localStream?.getTracks().forEach((t) => t.stop())
  deps.producer.close()
  deps.signaling.hostStopStream()
}

