export type ViewerPresence = {
  socketId: string
  enrollment: string
  name: string
  isViewing: boolean
  isAuthorized: boolean
}

export type RoomState = {
  connectedCount: number
  activeViewersCount: number
  viewers: ViewerPresence[]
}

