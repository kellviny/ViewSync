import type { RoomState } from '../../domain/models/RoomState'
import type { ServerInfo } from '../../domain/models/ServerInfo'

export type ViewerIdentity = {
  enrollment: string
  name: string
}

export type SignalingPort = {
  /** Escuta mudanças de conexão com o servidor. */
  onConnect: (cb: () => void) => () => void
  onDisconnect: (cb: () => void) => () => void

  /** Escuta atualizações do estado da sala. */
  onRoomState: (cb: (state: RoomState) => void) => () => void

  /** Escuta quando o viewer é autorizado a entrar. */
  onAuthorized: (cb: () => void) => () => void

  /** Escuta quando um novo producer aparece. */
  onNewProducer: (cb: (producerId: string) => void) => () => void

  /** Escuta erros vindos do servidor. */
  onError: (cb: (msg: string) => void) => () => void

  /** Escuta informações do servidor/transmissor. */
  onServerInfo: (cb: (info: ServerInfo) => void) => () => void

  /** Tenta entrar na sala com uma senha. */
  joinRoom: (password: string, identity: ViewerIdentity) => void

  /** Notifica o servidor sobre mudança de visibilidade da aba. */
  reportVisibility: (isVisible: boolean) => void

  /** Métodos de sinalização mediasoup. */
  getRouterRtpCapabilities: () => Promise<unknown>
  createWebRtcTransport: (direction: 'recv') => Promise<unknown>
  connectWebRtcTransport: (transportId: string, dtlsParameters: unknown) => void
  consumeStream: (params: { transportId: string; producerId: string; rtpCapabilities: unknown }) => Promise<unknown>
  resumeConsumer: (transportId: string, consumerId: string) => Promise<void>

  dispose: () => void
}
