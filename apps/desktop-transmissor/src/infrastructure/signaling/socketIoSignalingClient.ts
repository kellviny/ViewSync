import { io, type Socket } from 'socket.io-client'
import type { SignalingPort, WebRtcTransportDirection } from '../../application/ports/SignalingPort'
import type { RoomState } from '../../domain/models/RoomState'
import type { ServerInfo } from '../../domain/models/ServerInfo'
import type { StreamConfig } from '../../domain/models/StreamConfig'

export const createSocketIoSignalingClient = (url: string): SignalingPort => {
  const socket: Socket = io(url)

  const onConnectChange: SignalingPort['onConnectChange'] = (cb) => {
    const onConnect = () => cb(true)
    const onDisconnect = () => cb(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }

  const onServerInfo: SignalingPort['onServerInfo'] = (cb) => {
    const onInfo = (info: ServerInfo) => cb(info)
    socket.on('server:info', onInfo)
    return () => socket.off('server:info', onInfo)
  }

  const onRoomState: SignalingPort['onRoomState'] = (cb) => {
    const onState = (state: RoomState) => cb(state)
    socket.on('room:state_update', onState)
    return () => socket.off('room:state_update', onState)
  }

  const getRouterRtpCapabilities: SignalingPort['getRouterRtpCapabilities'] = async () => {
    return new Promise((resolve) => {
      socket.emit('mediasoup:getRouterRtpCapabilities', resolve)
    })
  }

  const createWebRtcTransport: SignalingPort['createWebRtcTransport'] = async (direction: WebRtcTransportDirection) => {
    return new Promise((resolve) => {
      socket.emit('mediasoup:createWebRtcTransport', { direction }, resolve)
    })
  }

  const connectWebRtcTransport: SignalingPort['connectWebRtcTransport'] = async (transportId, dtlsParameters) => {
    return new Promise<void>((resolve) => {
      socket.emit('mediasoup:connectWebRtcTransport', { transportId, dtlsParameters }, () => resolve())
    })
  }

  const produce: SignalingPort['produce'] = async (transportId, kind, rtpParameters) => {
    return new Promise((resolve) => {
      socket.emit('mediasoup:produce', { transportId, kind, rtpParameters }, resolve)
    })
  }

  const hostStartStream: SignalingPort['hostStartStream'] = (config: StreamConfig, password: string) => {
    return new Promise((resolve) => {
      socket.emit('host:start_stream', { config, password }, resolve)
    })
  }

  const hostStopStream: SignalingPort['hostStopStream'] = () => {
    socket.emit('host:stop_stream')
  }

  const requestServerInfo: SignalingPort['requestServerInfo'] = () => {
    socket.emit('host:request_info')
  }

  const hostSetNetwork: SignalingPort['hostSetNetwork'] = (ip, network) => {
    socket.emit('host:set_network', { ip, network })
  }

  const onStreamReport: SignalingPort['onStreamReport'] = (cb) => {
    const onReport = (report: any) => cb(report)
    socket.on('host:stream_report', onReport)
    return () => socket.off('host:stream_report', onReport)
  }

  const dispose: SignalingPort['dispose'] = () => {
    socket.off('connect')
    socket.off('disconnect')
    socket.off('server:info')
    socket.off('room:state_update')
  }

  return {
    onConnectChange,
    onServerInfo,
    onRoomState,
    getRouterRtpCapabilities,
    createWebRtcTransport,
    connectWebRtcTransport,
    produce,
    hostStartStream,
    hostStopStream,
    requestServerInfo,
    hostSetNetwork,
    onStreamReport,
    dispose,
  }
}

