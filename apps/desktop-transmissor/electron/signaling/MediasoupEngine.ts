import * as mediasoup from 'mediasoup'
import type {
  ConnectWebRtcTransportPayload,
  ConsumePayload,
  ProducePayload,
  ResumePayload,
} from './types'

const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
    preferredPayloadType: 101,
    parameters: {
      'x-google-start-bitrate': 1000,
      'x-google-max-bitrate': 5000,
    },
  },
]

type ConsumerAppData = {
  socketId: string
}

export class MediasoupEngine {
  private worker: mediasoup.types.Worker | null = null
  private router: mediasoup.types.Router | null = null
  private transports = new Map<string, mediasoup.types.WebRtcTransport>()
  private producers = new Map<string, mediasoup.types.Producer>()
  private consumers = new Map<string, mediasoup.types.Consumer<ConsumerAppData>>()

  public async initialize(rtcMinPort: number, rtcMaxPort: number): Promise<void> {
    this.worker = await mediasoup.createWorker({
      rtcMinPort,
      rtcMaxPort,
      logLevel: 'warn',
    })

    this.worker.on('died', () => process.exit(1))
    this.router = await this.worker.createRouter({ mediaCodecs })
  }

  public getRouterRtpCapabilities(): mediasoup.types.RtpCapabilities {
    if (!this.router) {
      throw new Error('Router not initialized')
    }

    return this.router.rtpCapabilities
  }

  public async createWebRtcTransport(announcedIp: string): Promise<mediasoup.types.WebRtcTransport> {
    if (!this.router) {
      throw new Error('Router not initialized')
    }

    const transport = await this.router.createWebRtcTransport({
      listenIps: [
        { ip: '0.0.0.0', announcedIp },
        { ip: '0.0.0.0', announcedIp: '127.0.0.1' },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
    })

    transport.on('dtlsstatechange', (dtlsState) => {
      if (dtlsState === 'closed') transport.close()
    })

    this.transports.set(transport.id, transport)
    return transport
  }

  public async connectWebRtcTransport(payload: ConnectWebRtcTransportPayload): Promise<void> {
    const transport = this.transports.get(payload.transportId)
    if (!transport) return
    await transport.connect({ dtlsParameters: payload.dtlsParameters })
  }

  public async produce(payload: ProducePayload): Promise<string | null> {
    const transport = this.transports.get(payload.transportId)
    if (!transport) return null

    const producer = await transport.produce({
      kind: payload.kind,
      rtpParameters: payload.rtpParameters,
    })

    this.producers.set(producer.id, producer)

    producer.on('transportclose', () => {
      producer.close()
      this.producers.delete(producer.id)
    })

    return producer.id
  }

  public async consume(socketId: string, payload: ConsumePayload): Promise<object | null> {
    if (!this.router) return null
    if (!this.router.canConsume({ producerId: payload.producerId, rtpCapabilities: payload.rtpCapabilities })) {
      return null
    }

    const transport = this.transports.get(payload.transportId)
    if (!transport) return null

    const consumer = await transport.consume({
      producerId: payload.producerId,
      rtpCapabilities: payload.rtpCapabilities,
      paused: true,
      appData: { socketId },
    })

    this.consumers.set(consumer.id, consumer)

    consumer.on('transportclose', () => {
      consumer.close()
      this.consumers.delete(consumer.id)
    })

    return {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    }
  }

  public async resume(payload: ResumePayload): Promise<void> {
    const consumer = this.consumers.get(payload.consumerId)
    if (!consumer) return
    await consumer.resume()
  }

  public async syncViewerVisibility(socketId: string, isVisible: boolean): Promise<void> {
    for (const consumer of this.consumers.values()) {
      if (consumer.appData.socketId !== socketId) continue
      if (consumer.closed) continue

      if (isVisible) {
        await consumer.resume().catch(() => undefined)
      } else {
        await consumer.pause().catch(() => undefined)
      }
    }
  }
}