import type { ScreenCapturePort } from '../../application/ports/ScreenCapturePort'

export type ChromeDesktopVideoConstraints = {
  mandatory: {
    chromeMediaSource: 'desktop'
    chromeMediaSourceId: string
    maxFrameRate: number
  }
}

export const createScreenCaptureAdapter = (): ScreenCapturePort => {
  return {
    capture: async (sourceId, fps) => {
      const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            maxFrameRate: fps,
          },
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints as any)
      return stream
    },
  }
}

