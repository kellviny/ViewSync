import { io, type Socket } from 'socket.io-client'
import type { SignalingPort } from '../../application/ports/SignalingPort'
import type { RoomState } from '../../domain/models/RoomState'
import type { ServerInfo } from '../../domain/models/ServerInfo'

export const createSocketIOSignalingAdapter = (serverUrl: string): SignalingPort => {
  const socket: Socket = io(serverUrl, { reconnectionDelay: 1000, reconnectionAttempts: Infinity })

  const on = <T>(event: string, cb: (arg: T) => void): (() => void) => {
    socket.on(event, cb)
    return () => socket.off(event, cb)
  }

  return {
    onConnect: (cb) => on('connect', cb),
    onDisconnect: (cb) => on('disconnect', cb),
    onRoomState: (cb) => on<RoomState>('room:state_update', cb),
    onAuthorized: (cb) => on('viewer:authorized', cb),
    onNewProducer: (cb) => {
      const handler = ({ producerId }: { producerId: string }) => cb(producerId)
      socket.on('mediasoup:newProducer', handler)
      return () => socket.off('mediasoup:newProducer', handler)
    },
    onError: (cb) => on<string>('error', cb),
    onServerInfo: (cb) => on<ServerInfo>('server:info', cb),

    joinRoom: (password, identity) => socket.emit('viewer:join', {
      password,
      viewerEnrollment: identity.enrollment,
      viewerName: identity.name,
    }),
    reportVisibility: (isVisible) => socket.emit('viewer:visibility_change', isVisible),

    getRouterRtpCapabilities: () =>
      new Promise((resolve) => socket.emit('mediasoup:getRouterRtpCapabilities', resolve)),

    createWebRtcTransport: (_direction) =>
      new Promise((resolve) => socket.emit('mediasoup:createWebRtcTransport', { direction: 'recv' }, resolve)),

    connectWebRtcTransport: (transportId, dtlsParameters) =>
      socket.emit('mediasoup:connectWebRtcTransport', { transportId, dtlsParameters }, () => {}),

    consumeStream: (params) =>
      new Promise((resolve) => socket.emit('mediasoup:consume', params, resolve)),

    resumeConsumer: (transportId, consumerId) =>
      new Promise((resolve) => socket.emit('mediasoup:resume', { transportId, consumerId }, resolve)),

    dispose: () => socket.disconnect(),
  }
}
