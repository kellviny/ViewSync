export type WebRtcTransportParams = {
  id: string
  iceParameters: object
  iceCandidates: object[]
  dtlsParameters: object
}

export type ConsumerParams = {
  id: string
  producerId: string
  kind: string
  rtpParameters: object
}
