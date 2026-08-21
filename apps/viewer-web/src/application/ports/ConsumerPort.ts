export type ConsumerPort = {
  /** Conecta ao stream de um producer e retorna a MediaStream pronta. */
  consumeStream: (producerId: string) => Promise<MediaStream>

  /** Libera todos os recursos (transport, consumer, device). */
  dispose: () => void
}
