import { Activity, Radio } from 'lucide-react'

export const ViewerHeader = ({ isConnected, isStreaming, networkName }: {
  isConnected: boolean
  isStreaming: boolean
  networkName?: string
}) => (
  <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5"
    style={{
      background: 'rgba(10,10,15,0.7)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--vs-border)',
    }}>
    {/* Logo */}
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] text-white"
        style={{ background: 'linear-gradient(135deg, #6366F1, #4338CA)', boxShadow: '0 0 12px rgba(99,102,241,0.5)' }}>
        Vs
      </div>
      <h1 className="text-sm font-bold text-white tracking-tight">
        ViewSync <span className="font-light" style={{ color: 'var(--vs-neon)' }}>Viewer</span>
      </h1>
    </div>

    {/* Status */}
    <div className="flex items-center gap-2">
      {networkName && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--vs-border)',
            color: 'var(--vs-text-muted)',
          }}>
          <Radio className="w-3 h-3" style={{ color: 'var(--vs-accent)' }} />
          {networkName}
        </div>
      )}

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest"
        style={{
          background: isConnected ? 'rgba(34,197,94,0.08)' : 'rgba(244,63,94,0.08)',
          border: `1px solid ${isConnected ? 'rgba(34,197,94,0.2)' : 'rgba(244,63,94,0.2)'}`,
          color: isConnected ? 'var(--vs-live)' : 'var(--vs-danger)',
        }}>
        <Activity className="w-3 h-3" />
        {isConnected ? 'Online' : 'Off'}
        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'animate-live' : ''}`}
          style={{ background: isConnected ? 'var(--vs-live)' : 'var(--vs-danger)' }} />
      </div>
      {isStreaming && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
          style={{
            background: 'rgba(244,63,94,0.12)',
            border: '1px solid rgba(244,63,94,0.3)',
            color: 'var(--vs-danger)',
          }}>
          <Radio className="w-3 h-3" />
          LIVE
        </div>
      )}
    </div>
  </header>
)
