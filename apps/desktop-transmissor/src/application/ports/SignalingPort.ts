import type { RoomState } from '../../domain/models/RoomState'
import type { ServerInfo } from '../../domain/models/ServerInfo'
import type { StreamConfig } from '../../domain/models/StreamConfig'

export type WebRtcTransportDirection = 'send' | 'recv'

export type SignalingPort = {
  onConnectChange: (cb: (connected: boolean) => void) => () => void
  onServerInfo: (cb: (info: ServerInfo) => void) => () => void
  onRoomState: (cb: (state: RoomState) => void) => () => void

  getRouterRtpCapabilities: () => Promise<unknown>
  createWebRtcTransport: (direction: WebRtcTransportDirection) => Promise<unknown>
  connectWebRtcTransport: (transportId: string, dtlsParameters: unknown) => Promise<void>
  produce: (transportId: string, kind: 'video' | 'audio', rtpParameters: any) => Promise<{ id: string }>

  hostStartStream: (config: StreamConfig, password: string) => Promise<{ adminToken: string }>
  hostStopStream: () => void
  requestServerInfo?: () => void
  hostSetNetwork?: (ip: string, network: string) => void
  onStreamReport?: (cb: (report: any) => void) => () => void
  dispose: () => void
}
