import { useEffect, useMemo, useRef, useState } from 'react'
import type { DesktopSource } from '../../domain/models/DesktopSource'
import type { RoomState } from '../../domain/models/RoomState'
import { refreshSources } from '../../application/usecases/RefreshSources'
import { startStream } from '../../application/usecases/StartStream'
import { stopStream } from '../../application/usecases/StopStream'
import { switchSource } from '../../application/usecases/SwitchSource'
import { createDesktopTransmissorCompositionRoot } from '../../app/compositionRoot'

export const useTransmissorController = () => {
  const deps = useMemo(() => createDesktopTransmissorCompositionRoot(), [])

  const [sources, setSources] = useState<DesktopSource[]>([])
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [password, setPassword] = useState('')
  const [fps, setFps] = useState(30)
  const [serverIp, setServerIp] = useState('Carregando...')
  const [serverPort, setServerPort] = useState(3000)
  const [networkName, setNetworkName] = useState('Detectando...')
  const [networkInterfaces, setNetworkInterfaces] = useState<{ name: string; ip: string }[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [roomState, setRoomState] = useState<RoomState>({ connectedCount: 0, activeViewersCount: 0, viewers: [] })
  const [isConnected, setIsConnected] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [streamReport, setStreamReport] = useState<any | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const isStartingRef = useRef(false)

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
      videoRef.current.play().catch(() => {})
    }
  }, [localStream, isStreaming])

  const doRefreshSources = async () => {
    try {
      const next = await refreshSources({ desktopSources: deps.desktopSources })
      setSources(next || [])
      if (next && next.length > 0 && selectedSource === null) {
        setSelectedSource(next[0].id)
      }
    } catch {}
  }

  useEffect(() => {
    const unsubConnect = deps.signaling.onConnectChange(setIsConnected)
    const unsubServerInfo = deps.signaling.onServerInfo((info) => {
      setServerIp(info.ip)
      setServerPort(info.port)
      setNetworkName(info.network || 'Rede Local')
      setNetworkInterfaces(info.interfaces || [])
      if (info.adminToken) setAdminToken(info.adminToken)
    })
    const unsubRoomState = deps.signaling.onRoomState(setRoomState)
    let unsubReport: (() => void) | undefined
    if (deps.signaling.onStreamReport) {
      unsubReport = deps.signaling.onStreamReport((report: any) => {
        setStreamReport(report)
      })
    }

    doRefreshSources()

    const sourceInterval = window.setInterval(() => {
      if (!isStreaming && !isStartingRef.current) {
        doRefreshSources()
      }
    }, 5000)

    return () => {
      unsubConnect()
      unsubServerInfo()
      unsubRoomState()
      if (unsubReport) unsubReport()
      deps.signaling.dispose()
      window.clearInterval(sourceInterval)
    }
  }, [deps, isStreaming])

  useEffect(() => {
    if (isStreaming && selectedSource && !isStartingRef.current) {
      switchSource({
        screenCapture: deps.screenCapture,
        producer: deps.producer,
        params: { sourceId: selectedSource, fps },
        localStream,
      })
        .then((stream) => setLocalStream(stream))
        .catch(() => {})
    }
  }, [selectedSource])

  const copyUrl = async () => {
    try {
      await deps.clipboard.copy(`http://${serverIp}:${serverPort}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const onStartStream = async () => {
    if (!selectedSource || isStartingRef.current) return

    isStartingRef.current = true
    setIsStarting(true)

    try {
      const effectivePassword = import.meta.env.VITE_APP_MODE === 'institutional' ? '' : password
      const { stream, adminToken } = await startStream({
        signaling: deps.signaling,
        screenCapture: deps.screenCapture,
        producer: deps.producer,
        params: { sourceId: selectedSource, fps, password: effectivePassword },
      })

      setLocalStream(stream)
      setAdminToken(adminToken)
      setIsStreaming(true)
    } catch {
      alert('Erro ao iniciar captura. Verifique as permissões.')
    } finally {
      isStartingRef.current = false
      setIsStarting(false)
    }
  }

  const onStopStream = () => {
    stopStream({ signaling: deps.signaling, producer: deps.producer, localStream })
    setLocalStream(null)
    setAdminToken(null)
    setIsStreaming(false)
  }

  const onSetNetwork = (ip: string, network: string) => {
    deps.signaling.hostSetNetwork?.(ip, network)
  }

  return {
    copied,
    copyUrl,
    fps,
    isConnected,
    isStarting,
    isStreaming,
    localStream,
    networkName,
    networkInterfaces,
    adminToken,
    streamReport,
    setStreamReport,
    onStartStream,
    onStopStream,
    onSetNetwork,
    password,
    roomState,
    selectedSource,
    serverIp,
    serverPort,
    setFps,
    setPassword,
    setSelectedSource,
    sources,
    videoRef,
  }
}

