import { Play, Shield, Zap, Globe } from 'lucide-react'

const FPS_OPTIONS = [
  { value: 15, label: '15 FPS', desc: 'Eco' },
  { value: 30, label: '30 FPS', desc: 'Ideal' },
  { value: 60, label: '60 FPS', desc: 'Fluido' },
]

export const StreamSettingsBar = ({
  fps,
  password,
  isStreaming,
  isStarting,
  canStart,
  networkInterfaces,
  serverIp,
  onChangeFps,
  onChangePassword,
  onSetNetwork,
  onStartStream,
}: {
  fps: number
  password: string
  isStreaming: boolean
  isStarting: boolean
  canStart: boolean
  networkInterfaces: { name: string; ip: string }[]
  serverIp: string
  onChangeFps: (fps: number) => void
  onChangePassword: (password: string) => void
  onSetNetwork: (ip: string, network: string) => void
  onStartStream: () => void
}) => {
  // Oculta completamente durante o streaming (controles ficam no header e no painel)
  if (isStreaming) return null

  return (
    <div
      className="rounded-2xl px-5 py-4 flex flex-wrap gap-4 items-center"
      style={{
        background: 'var(--vs-bg-card)',
        border: '1px solid var(--vs-border)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* FPS Segmented Control */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
          style={{ color: 'var(--vs-text-muted)' }}
        >
          <Zap className="w-2.5 h-2.5" style={{ color: 'var(--vs-accent)' }} />
          Taxa de Quadros
        </label>
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--vs-border)' }}
        >
          {FPS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              disabled={isStreaming}
              onClick={() => onChangeFps(opt.value)}
              className="px-4 py-2 text-xs font-bold transition-all duration-200 cursor-pointer"
              style={{
                background: fps === opt.value ? 'var(--vs-accent)' : 'transparent',
                color: fps === opt.value ? '#fff' : 'var(--vs-text-muted)',
                boxShadow: fps === opt.value ? 'var(--vs-glow-sm)' : 'none',
              }}
            >
              <span className="block leading-none">{opt.label}</span>
              <span className="block text-[9px] font-normal opacity-60 mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 self-center" style={{ background: 'var(--vs-border)' }} />

      {/* Network Select */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-[160px] max-w-xs">
        <label
          className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
          style={{ color: 'var(--vs-text-muted)' }}
        >
          <Globe className="w-2.5 h-2.5" style={{ color: 'var(--vs-accent)' }} />
          Interface de Rede
        </label>
        <div className="relative flex items-center">
          <Globe
            className="absolute left-3 w-4 h-4 pointer-events-none z-10"
            style={{ color: 'var(--vs-text-muted)' }}
          />
          <select
            className="vs-input appearance-none w-full cursor-pointer text-sm font-bold"
            style={{ paddingLeft: '2.25rem' }}
            value={serverIp}
            onChange={(e) => {
              const selected = networkInterfaces.find(n => n.ip === e.target.value)
              if (selected) onSetNetwork(selected.ip, selected.name)
            }}
            disabled={isStreaming || networkInterfaces.length === 0}
          >
            {networkInterfaces.length === 0 && <option value={serverIp}>Carregando...</option>}
            {networkInterfaces.map(n => (
              <option key={n.ip} value={n.ip}>{n.name} ({n.ip})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Password Input — Hidden in institutional mode; protected against autofill in normal mode */}
      {import.meta.env.VITE_APP_MODE !== 'institutional' && (
        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px] max-w-xs">
          <label
            className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
            style={{ color: 'var(--vs-text-muted)' }}
          >
            <Shield className="w-2.5 h-2.5" style={{ color: 'var(--vs-accent)' }} />
            Senha da Sala
          </label>
          <div className="relative flex items-center">
            <Shield
              className="absolute left-3 w-4 h-4 pointer-events-none z-10"
              style={{ color: 'var(--vs-text-muted)' }}
            />
            <input
              type="password"
              name={`room-pass-${Date.now()}`}
              readOnly
              onFocus={(e) => e.target.removeAttribute('readonly')}
              autoComplete="new-password"
              placeholder="Opcional..."
              className="vs-input"
              style={{ paddingLeft: '2.25rem' }}
              value={password}
              onChange={(e) => onChangePassword(e.target.value)}
              disabled={isStreaming}
            />
          </div>
        </div>
      )}


      {/* CTA — always at right */}
      <button
        onClick={onStartStream}
        disabled={!canStart || isStarting}
        className="ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-sm text-white cursor-pointer transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        style={{
          background:
            canStart && !isStarting
              ? 'linear-gradient(135deg, #6366F1, #4338CA)'
              : 'rgba(255,255,255,0.05)',
          boxShadow: canStart && !isStarting ? 'var(--vs-glow-md)' : 'none',
        }}
      >
        {isStarting ? (
          <>
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            Iniciar Transmissão
          </>
        )}
      </button>
    </div>
  )
}
