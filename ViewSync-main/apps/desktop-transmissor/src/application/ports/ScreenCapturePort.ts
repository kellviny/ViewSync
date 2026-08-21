export type ScreenCapturePort = {
  capture: (sourceId: string, fps: number) => Promise<MediaStream>
}

