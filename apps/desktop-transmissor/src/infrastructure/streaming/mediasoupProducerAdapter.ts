import { Device } from 'mediasoup-client'
import type { types } from 'mediasoup-client'
import type { ProducerPort } from '../../application/ports/ProducerPort'
import type { SignalingPort } from '../../application/ports/SignalingPort'

export const createMediasoupProducerAdapter = (signaling: SignalingPort): ProducerPort => {
  let device: Device | null = null
  let transport: types.Transport | null = null
  let producer: types.Producer | null = null

  const startProducing: ProducerPort['startProducing'] = async ({ rtpCapabilities, transportParams, track }) => {
    device = new Device()
    await device.load({ routerRtpCapabilities: rtpCapabilities as any })

    transport = device.createSendTransport(transportParams as any)

    transport.on('connect', ({ dtlsParameters }: { dtlsParameters: types.DtlsParameters }, callback: () => void, errback: (err: Error) => void) => {
      signaling
        .connectWebRtcTransport(transport!.id, dtlsParameters)
        .then(() => callback())
        .catch((err: Error) => errback(err))
    })

    transport.on('produce', ({ kind, rtpParameters }: { kind: types.MediaKind; rtpParameters: types.RtpParameters }, callback: ({ id }: { id: string }) => void, errback: (err: Error) => void) => {
      signaling
        .produce(transport!.id, kind, rtpParameters)
        .then(({ id }) => callback({ id }))
        .catch((err: Error) => errback(err))
    })

    producer = await transport.produce({ track })
    return { producerId: producer.id }
  }

  const replaceTrack: ProducerPort['replaceTrack'] = async (track) => {
    if (!producer) return
    await producer.replaceTrack({ track })
  }

  const close: ProducerPort['close'] = () => {
    try {
      producer?.close()
    } catch {}
    try {
      transport?.close()
    } catch {}
    producer = null
    transport = null
    device = null
  }

  return { startProducing, replaceTrack, close }
}

