export type ProducerPort = {
  startProducing: (params: {
    rtpCapabilities: unknown
    transportParams: unknown
    track: MediaStreamTrack
  }) => Promise<{ producerId: string }>
  replaceTrack: (track: MediaStreamTrack) => Promise<void>
  close: () => void
}

