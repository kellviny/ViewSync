import type {
  HostStartStreamPayload,
  RoomPublicState,
  StreamConfig,
  ViewerJoinPayload,
  ViewerPresence,
} from './types'

type RoomRuntimeState = {
  isStreaming: boolean
  config: StreamConfig | null
}

export class RoomSessionState {
  private roomState: RoomRuntimeState = {
    isStreaming: false,
    config: null,
  }

  private currentHostId: string | null = null
  private roomPassword = ''
  private adminToken = Math.random().toString(36).substring(2, 15).toUpperCase()
  private activeViewers = new Set<string>() // Set of socketIds viewing the stream
  private connectedSockets = new Set<string>() // Set of socketIds currently connected to the room
  private socketToEnrollment = new Map<string, string>() // socketId -> enrollment
  private historicalSocketToEnrollment = new Map<string, string>() // socketId -> enrollment (persists across disconnects for report)
  private knownViewers = new Map<string, { enrollment: string; name: string }>() // enrollment -> identity
  private streamStartTime: number | null = null
  private viewMetrics = new Map<string, { totalTimeMs: number; lastActiveAt: number | null }>()

  public onSocketConnected(socketId: string): void {
    void socketId
  }

  public isHostSocket(socketId: string): boolean {
    return this.currentHostId === socketId
  }

  public onHostStartStream(socketId: string, payload: HostStartStreamPayload): void {
    this.currentHostId = socketId
    this.activeViewers.delete(socketId)
    this.roomPassword = payload.password || ''
    this.roomState.isStreaming = true
    this.roomState.config = payload.config || null
    this.streamStartTime = Date.now()
    this.viewMetrics.clear()
  }

  public onHostStopStream(socketId: string): { report: any } | false {
    if (!this.isHostSocket(socketId)) return false
    const report = this.generateReport()
    this.resetRoom()
    return { report }
  }

  public onSocketDisconnect(socketId: string): void {
    this.setViewerVisibility(socketId, false)
    this.activeViewers.delete(socketId)
    this.connectedSockets.delete(socketId)
    this.socketToEnrollment.delete(socketId)

    if (this.currentHostId === socketId) {
      this.resetRoom()
    }
  }

  public registerViewerIdentity(socketId: string, enrollment: string, name: string): void {
    if (this.isHostSocket(socketId)) return

    this.socketToEnrollment.set(socketId, enrollment)
    this.historicalSocketToEnrollment.set(socketId, enrollment)
    this.connectedSockets.add(socketId)
    this.knownViewers.set(enrollment, { enrollment, name })
  }

  public getViewerIdentity(socketId: string): { enrollment: string; name: string } | null {
    const enrollment = this.socketToEnrollment.get(socketId)
    if (!enrollment) return null
    return this.knownViewers.get(enrollment) || null
  }

  public isViewerAuthorized(payload: ViewerJoinPayload): boolean {
    if (!this.roomState.config?.hasPassword) return true
    return payload.password === this.roomPassword
  }

  public setViewerVisibility(socketId: string, isVisible: boolean): void {
    if (this.isHostSocket(socketId)) return
    if (!this.socketToEnrollment.has(socketId)) return
    
    let metrics = this.viewMetrics.get(socketId)
    if (!metrics) {
      metrics = { totalTimeMs: 0, lastActiveAt: null }
      this.viewMetrics.set(socketId, metrics)
    }

    if (isVisible) {
      this.activeViewers.add(socketId)
      if (metrics.lastActiveAt === null) {
        metrics.lastActiveAt = Date.now()
      }
    } else {
      this.activeViewers.delete(socketId)
      if (metrics.lastActiveAt !== null) {
        metrics.totalTimeMs += Date.now() - metrics.lastActiveAt
        metrics.lastActiveAt = null
      }
    }
  }

  private buildViewerPresenceList(): ViewerPresence[] {
    const presences: ViewerPresence[] = []

    for (const [enrollment, identity] of this.knownViewers.entries()) {
      // Find all connected sockets for this enrollment (user might have multiple tabs)
      let isOnline = false
      let isViewing = false

      for (const [socketId, mappedEnrollment] of this.socketToEnrollment.entries()) {
        if (mappedEnrollment === enrollment) {
          if (this.connectedSockets.has(socketId)) isOnline = true
          if (this.activeViewers.has(socketId)) isViewing = true
        }
      }

      presences.push({
        enrollment,
        name: identity.name,
        isViewing,
        isOnline,
      })
    }

    return presences
  }

  public buildPublicState(): RoomPublicState {
    const viewers = this.buildViewerPresenceList()

    return {
      isStreaming: this.roomState.isStreaming,
      connectedCount: viewers.length,
      activeViewersCount: this.activeViewers.size,
      config: this.roomState.config,
      hostId: this.currentHostId,
      viewers,
    }
  }

  private generateReport(): any {
    if (!this.streamStartTime) return null
    const durationMs = Date.now() - this.streamStartTime

    // Force update active viewers to flush current time into totalTimeMs
    for (const socketId of this.activeViewers) {
      const metrics = this.viewMetrics.get(socketId)
      if (metrics && metrics.lastActiveAt !== null) {
         metrics.totalTimeMs += Date.now() - metrics.lastActiveAt
         metrics.lastActiveAt = Date.now()
      }
    }

    const viewersReport = Array.from(this.knownViewers.values()).map((identity) => {
      let totalTimeMs = 0
      for (const [socketId, mappedEnrollment] of this.historicalSocketToEnrollment.entries()) {
        if (mappedEnrollment === identity.enrollment) {
           const metrics = this.viewMetrics.get(socketId)
           if (metrics) totalTimeMs += metrics.totalTimeMs
        }
      }
      return {
        enrollment: identity.enrollment,
        name: identity.name,
        totalTimeMs
      }
    }).filter(v => v.totalTimeMs > 0).sort((a, b) => a.totalTimeMs - b.totalTimeMs)

    let totalAllTime = 0
    viewersReport.forEach(v => totalAllTime += v.totalTimeMs)

    return {
      durationMs,
      averageTimeMs: viewersReport.length > 0 ? totalAllTime / viewersReport.length : 0,
      minViewer: viewersReport.length > 0 ? viewersReport[0] : null,
      maxViewer: viewersReport.length > 0 ? viewersReport[viewersReport.length - 1] : null,
      viewers: viewersReport
    }
  }

  private resetRoom(): void {
    this.currentHostId = null
    this.roomPassword = ''
    this.adminToken = Math.random().toString(36).substring(2, 15).toUpperCase()
    this.roomState.isStreaming = false
    this.roomState.config = null
    this.activeViewers.clear()
    this.connectedSockets.clear()
    this.socketToEnrollment.clear()
    this.historicalSocketToEnrollment.clear()
    this.knownViewers.clear()
    this.viewMetrics.clear()
    this.streamStartTime = null
  }

  public getAdminToken(): string {
    return this.adminToken
  }
}