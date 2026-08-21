import { Check, Copy, Eye, EyeOff, Monitor, Radio, Wifi, Shield, Users, X, QrCode } from 'lucide-react'
import { memo, useMemo, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import type { RefObject } from 'react'
import type { DesktopSource } from '../../domain/models/DesktopSource'
import type { RoomState } from '../../domain/models/RoomState'

// Cyan neon — combina melhor com o tema cyberpunk OLED
const CYAN      = '#22D3EE'   // cyan-400
const CYAN_GLOW = 'rgba(34,211,238,0.3)'
const CYAN_DIM  = 'rgba(34,211,238,0.08)'
const CYAN_BDR  = 'rgba(34,211,238,0.2)'

export const StreamingPanel = ({
  copied,
  fps,
  networkName,
  password,
  adminToken,
  roomState,
  selectedSource,
  serverIp,
  serverPort,
  sources,
  videoRef,
  onCopyUrl,
  onSelectSource,
}: {
  copied: boolean
  fps: number
  networkName: string
  password: string
  adminToken: string | null
  roomState: RoomState
  selectedSource: string | null
  serverIp: string
  serverPort: number
  sources: DesktopSource[]
  videoRef: RefObject<HTMLVideoElement | null>
  onCopyUrl: () => void
  onSelectSource: (sourceId: string) => void
}) => {
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false)
  const [isAdminQrModalOpen, setIsAdminQrModalOpen] = useState(false)
  const [isStudentQrModalOpen, setIsStudentQrModalOpen] = useState(false)

  const handleSetAdminQrModalOpen = (open: boolean) => {
    setIsAdminQrModalOpen(open)
    if (typeof window !== 'undefined' && (window as any).ipcRenderer?.invoke) {
      (window as any).ipcRenderer.invoke('set-content-protection', open).catch(() => {})
    }
  }

  const url = `http://${serverIp}:${serverPort}`
  const adminUrl = adminToken ? `${url}/admin#${adminToken}` : ''

  return (
    <div className="space-y-4 animate-fade-up">

      {/* ── Status bar: LIVE + URL + Network ─────────────── */}
      <div
        className="rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{
          background: CYAN_DIM,
          border: `1px solid ${CYAN_BDR}`,
          boxShadow: `0 0 24px rgba(34,211,238,0.05)`,
        }}
      >
        {/* Left: LIVE + FPS badge + network */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-live"
              style={{ background: CYAN, boxShadow: `0 0 8px ${CYAN_GLOW}` }}
            />
            <span className="text-xs font-black tracking-widest uppercase" style={{ color: CYAN }}>
              Ao Vivo
            </span>
          </div>
          <span
            className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--vs-text-muted)', border: '1px solid var(--vs-border)' }}
          >
            {fps} FPS
          </span>
          <div className="flex items-center gap-1.5 text-[10px] font-medium" style={{ color: 'var(--vs-text-muted)' }}>
            <Wifi className="w-3 h-3" style={{ color: CYAN }} />
            <span className="font-bold text-white">{networkName}</span>
          </div>

          {password && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold" 
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vs-border)' }}>
              <Shield className="w-3 h-3" style={{ color: CYAN }} />
              <span style={{ color: 'var(--vs-text-muted)' }}>Senha:</span>
              <span className="text-white font-mono">{password}</span>
            </div>
          )}
        </div>

        {/* Right: URL + copy */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--vs-text-muted)' }}>
            Acesso:
          </span>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${CYAN_BDR}` }}
          >
            <span
              className="text-sm font-black"
              style={{ color: CYAN, fontFamily: 'var(--font-mono)' }}
            >
              {url}
            </span>
            <button
              onClick={onCopyUrl}
              className="p-1 rounded-lg cursor-pointer transition-all duration-200 active:scale-90"
              style={{
                background: copied ? CYAN_DIM : 'rgba(255,255,255,0.05)',
                color: copied ? CYAN : 'var(--vs-text-muted)',
              }}
              title="Copiar link"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Control Bar: Admin Panel Button (Institucional) ─────────────── */}
      {import.meta.env.VITE_APP_MODE === 'institutional' && (
        <div className="flex justify-end mt-2 mb-4">
          <button
            onClick={() => handleSetAdminQrModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #4338CA)',
              color: 'white',
              boxShadow: 'var(--vs-glow-sm)',
            }}
          >
            <Shield className="w-3.5 h-3.5" />
            Painel do Professor
          </button>
        </div>
      )}

      {/* ── Metrics + Preview ─────────────────────────────── */}
      <div className="grid grid-cols-[auto_1fr] gap-4">

        {/* Metrics + Student QR — compact side column */}
        <div className="flex flex-col gap-3 w-40">
          <div className="flex flex-col gap-3">
            <MetricCard
              icon={<Radio className="w-3.5 h-3.5" />}
              label="Na rede"
              value={roomState.connectedCount}
              color="var(--vs-accent)"
              glowColor="rgba(99,102,241,0.3)"
              onClick={() => setIsAudienceModalOpen(true)}
            />
            <MetricCard
              icon={<Eye className="w-3.5 h-3.5" />}
              label="Assistindo"
              value={roomState.activeViewersCount}
              color={CYAN}
              glowColor={CYAN_GLOW}
              onClick={() => setIsAudienceModalOpen(true)}
            />
          </div>

          <button
            onClick={() => setIsStudentQrModalOpen(true)}
            className="mt-2 w-full flex flex-col items-center justify-center gap-2 py-5 rounded-xl transition-all duration-200 hover:bg-white/5 active:scale-95"
            style={{ 
              background: 'linear-gradient(180deg, rgba(16,20,30,0.96), rgba(10,12,20,0.96))',
              border: '1px dashed rgba(255,255,255,0.1)' 
            }}
          >
            <QrCode className="w-8 h-8" style={{ color: 'var(--vs-text-muted)' }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--vs-text-muted)' }}>
              Mostrar QR Code
            </span>
          </button>
        </div>

        {/* Video preview */}
        <div
          className="relative rounded-2xl overflow-hidden bg-black"
          style={{
            border: `1px solid ${CYAN_BDR}`,
            boxShadow: `0 0 24px rgba(34,211,238,0.04)`,
            aspectRatio: '16/9',
          }}
        >
          <video ref={videoRef} className="w-full h-full object-contain" muted autoPlay playsInline />
          <div className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{ boxShadow: `inset 0 0 0 1px ${CYAN_DIM}` }} />
          {/* REC badge */}
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
            style={{ background: 'rgba(244,63,94,0.9)', color: 'white', boxShadow: '0 0 8px rgba(244,63,94,0.5)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            REC
          </div>
        </div>
      </div>

      {/* ── Source tray ───────────────────────────────────── */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'var(--vs-bg-card)', border: '1px solid var(--vs-border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-3.5 h-3.5" style={{ color: 'var(--vs-accent)' }} />
          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--vs-text-muted)' }}>
            Trocar Fonte
          </span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1">
          {sources.map((source) => {
            const isActive = selectedSource === source.id
            return (
              <div
                key={source.id}
                onClick={() => onSelectSource(source.id)}
                className="flex-shrink-0 w-28 cursor-pointer rounded-xl overflow-hidden transition-all duration-200 active:scale-95"
                style={{
                  border: `1px solid ${isActive ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
                  opacity: isActive ? 1 : 0.5,
                  boxShadow: isActive ? 'var(--vs-glow-sm)' : 'none',
                  transform: isActive ? 'scale(1.04)' : undefined,
                }}
              >
                <img
                  src={source.thumbnail}
                  alt={source.name}
                  className="w-full object-cover bg-black"
                  style={{ height: '56px' }}
                />
                <div
                  className="px-2 py-1.5 text-center text-[9px] font-bold truncate"
                  style={{
                    background: isActive ? 'var(--vs-accent-dim)' : 'rgba(0,0,0,0.4)',
                    color: isActive ? 'var(--vs-neon)' : 'var(--vs-text-muted)',
                  }}
                >
                  {source.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isAudienceModalOpen && (
        <AudienceModal
          connectedCount={roomState.connectedCount}
          activeViewersCount={roomState.activeViewersCount}
          viewers={roomState.viewers}
          onClose={() => setIsAudienceModalOpen(false)}
        />
      )}

      {isAdminQrModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-black/90 p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full relative">
            <button
              onClick={() => handleSetAdminQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Painel Admin
              </h2>
              <p className="text-xs text-gray-400 font-medium">Escaneie com seu celular para gerenciar a sala</p>
            </div>
            <div 
              className="p-4 bg-white rounded-xl cursor-pointer hover:scale-105 transition-transform"
              onClick={() => {
                navigator.clipboard.writeText(adminUrl)
                alert('Link de admin copiado!')
              }}
              title="Copiar Link Admin"
            >
              <QRCodeSVG value={adminUrl} size={200} />
            </div>
            <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest break-all w-full px-4">
              {adminUrl}
            </p>
          </div>
        </div>
      )}

      {isStudentQrModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" style={{ background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(8px)' }}>
          <div className="bg-black/90 p-8 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center gap-6 max-w-sm w-full relative">
            <button
              onClick={() => setIsStudentQrModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-white flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                Acesso do Aluno
              </h2>
              <p className="text-xs text-gray-400 font-medium">Escaneie para acessar a transmissão</p>
            </div>
            <div 
              className="p-4 bg-white rounded-xl cursor-pointer hover:scale-105 transition-transform"
              onClick={() => {
                onCopyUrl()
                setIsStudentQrModalOpen(false)
              }}
              title="Copiar Link e Fechar"
            >
              <QRCodeSVG value={url} size={240} />
            </div>
            <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest break-all w-full px-4">
              {url}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Metric card — números menores e elegantes
const MetricCard = ({
  icon,
  label,
  value,
  color,
  glowColor,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
  glowColor: string
  onClick?: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex-1 rounded-xl p-4 flex flex-col gap-2"
    style={{
      background: 'linear-gradient(180deg, rgba(16,20,30,0.96), rgba(10,12,20,0.96))',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
    }}
  >
    <div
      className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest"
      style={{ color: 'var(--vs-text-muted)' }}
    >
      <span style={{ color }}>{icon}</span>
      {label}
    </div>
    <div
      className="text-2xl font-black leading-none"
      style={{
        color,
        textShadow: `0 0 16px ${glowColor}`,
        fontFamily: 'var(--font-mono)',
      }}
    >
      {value}
    </div>
  </button>
)

// Linha individual de viewer — memo evita re-render quando outros viewers mudam
const ViewerRow = memo(({ viewer }: { viewer: RoomState['viewers'][number] }) => (
  <div
    key={viewer.socketId}
    className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
    style={{
      background: 'rgba(8,12,20,0.9)',
      border: '1px solid rgba(255,255,255,0.12)',
    }}
  >
    <div className="min-w-0">
      <div className="text-sm font-bold text-white truncate">{viewer.name}</div>
      <div className="text-[11px]" style={{ color: 'var(--vs-text-muted)' }}>
        Matrícula: {viewer.enrollment}
        {!viewer.isAuthorized ? ' • Não autenticado' : ''}
      </div>
    </div>

    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider flex-shrink-0"
      style={{
        background: viewer.isViewing ? CYAN_DIM : 'rgba(255,255,255,0.04)',
        border: `1px solid ${viewer.isViewing ? CYAN_BDR : 'var(--vs-border)'}`,
        color: viewer.isViewing ? CYAN : 'var(--vs-text-muted)',
      }}
    >
      {viewer.isViewing ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
      {viewer.isViewing ? 'Vendo' : 'Conectado'}
    </div>
  </div>
))

// AudienceModal — memo evita re-render quando props não mudaram
const AudienceModal = memo(({
  connectedCount,
  activeViewersCount,
  viewers,
  onClose,
}: {
  connectedCount: number
  activeViewersCount: number
  viewers: RoomState['viewers']
  onClose: () => void
}) => {
  // useMemo: ordena viewers apenas quando a lista mudar, não a cada render do pai
  const sortedViewers = useMemo(
    () => [...viewers].sort((a, b) => {
      // Quem NÃO está vendo aparece primeiro (atenção do professor)
      if (!a.isViewing && b.isViewing) return -1
      if (a.isViewing && !b.isViewing) return 1
      return a.name.localeCompare(b.name)
    }),
    [viewers]
  )

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(2,4,10,0.82)', backdropFilter: 'blur(6px)' }}>
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(15,19,30,0.98), rgba(8,10,16,0.98))',
          border: '1px solid rgba(34,211,238,0.25)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.65)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--vs-border)' }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: CYAN }} />
            <h3 className="text-sm font-black tracking-wider uppercase text-white">Audiência em Tempo Real</h3>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg"
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--vs-border)', color: 'var(--vs-text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 flex items-center gap-3 text-xs" style={{ borderBottom: '1px solid var(--vs-border)' }}>
          <span style={{ color: 'var(--vs-text-muted)' }}>Conectados:</span>
          <span className="font-black" style={{ color: 'var(--vs-neon)' }}>{connectedCount}</span>
          <span style={{ color: 'var(--vs-text-muted)' }}>• Assistindo:</span>
          <span className="font-black" style={{ color: CYAN }}>{activeViewersCount}</span>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-4 space-y-2">
          {sortedViewers.length === 0 ? (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vs-border)', color: 'var(--vs-text-muted)' }}
            >
              Nenhum viewer conectado no momento.
            </div>
          ) : (
            sortedViewers.map((viewer) => (
              <ViewerRow key={viewer.socketId} viewer={viewer} />
            ))
          )}
        </div>
      </div>
    </div>
  )
})
