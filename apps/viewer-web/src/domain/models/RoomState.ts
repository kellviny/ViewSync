export type RoomState = {
  isStreaming: boolean
  connectedCount: number
  activeViewersCount: number
  config?: {
    hasPassword?: boolean
    producerId?: string
  } | null
  hostId?: string | null
}
