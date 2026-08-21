import type { ScreenCapturePort } from '../../application/ports/ScreenCapturePort'

type ChromeDesktopVideoConstraints = {
  mandatory: {
    chromeMediaSource: 'desktop'
    chromeMediaSourceId: string
    minFrameRate: number
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
            minFrameRate: 10,
            maxFrameRate: fps,
          } satisfies ChromeDesktopVideoConstraints['mandatory'],
        },
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints as any)
      return stream
    },
  }
}

