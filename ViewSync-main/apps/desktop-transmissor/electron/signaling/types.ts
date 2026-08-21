import * as mediasoup from 'mediasoup'

export type StreamConfig = {
  hasPassword?: boolean
  producerId?: string
  [key: string]: unknown
}

export type HostStartStreamPayload = {
  password?: string
  config?: StreamConfig
}

export type ViewerJoinPayload = {
  password?: string
  viewerEnrollment?: string
  viewerName?: string
}

export type ViewerPresence = {
  socketId?: string
  enrollment: string
  name: string
  isViewing: boolean
  isOnline: boolean
}

export type RoomPublicState = {
  isStreaming: boolean
  connectedCount: number
  activeViewersCount: number
  config: StreamConfig | null
  hostId: string | null
  viewers: ViewerPresence[]
}

export type ConnectWebRtcTransportPayload = {
  transportId: string
  dtlsParameters: mediasoup.types.DtlsParameters
}

export type ProducePayload = {
  transportId: string
  kind: mediasoup.types.MediaKind
  rtpParameters: mediasoup.types.RtpParameters
}

export type ConsumePayload = {
  transportId: string
  producerId: string
  rtpCapabilities: mediasoup.types.RtpCapabilities
}

export type ResumePayload = {
  consumerId: string
}