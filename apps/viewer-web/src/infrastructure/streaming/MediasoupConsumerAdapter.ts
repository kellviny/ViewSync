import { Device } from 'mediasoup-client'
import type { SignalingPort } from '../../application/ports/SignalingPort'
import type { ConsumerPort } from '../../application/ports/ConsumerPort'

export const createMediasoupConsumerAdapter = (signaling: SignalingPort): ConsumerPort => {
  let device: Device | null = null
  let transport: ReturnType<Device['createRecvTransport']> | null = null

  const consumeStream = async (producerId: string): Promise<MediaStream> => {
    // 1. Carrega o Device com as capacidades do router
    const rtpCapabilities = await signaling.getRouterRtpCapabilities()
    if (!device) {
      device = new Device()
      await device.load({ routerRtpCapabilities: rtpCapabilities as any })
    }

    // 2. Cria o transport de recebimento
    const transportParams = await signaling.createWebRtcTransport('recv')
    transport = device.createRecvTransport(transportParams as any)

    // 3. Handler de conexão DTLS
    transport.on('connect', ({ dtlsParameters }, callback, errback) => {
      try {
        signaling.connectWebRtcTransport((transport as any).id, dtlsParameters)
        callback()
      } catch (err) {
        errback(err as Error)
      }
    })

    // 4. Consome o producer
    const consumerParams = await signaling.consumeStream({
      transportId: (transport as any).id,
      producerId,
      rtpCapabilities: device.rtpCapabilities,
    })

    const consumer = await transport.consume(consumerParams as any)

    // 5. Resume — o servidor cria o consumer pausado
    await signaling.resumeConsumer((transport as any).id, consumer.id)

    return new MediaStream([consumer.track])
  }

  const dispose = () => {
    try { transport?.close() } catch {}
    transport = null
    device = null
  }

  return { consumeStream, dispose }
}
