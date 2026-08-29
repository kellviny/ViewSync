import { Activity, Radio, Square, Globe, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export const StudioHeader = ({
  isConnected,
  isStreaming,
  networkName,
  serverIp,
  serverPort,
  onStopStream,
}: {
  isConnected: boolean
  isStreaming: boolean
  networkName?: string
  serverIp?: string
  serverPort?: number
  onStopStream?: () => void
}) => {
  const [copied, setCopied] = useState(false)
  const showAddress = isConnected && serverIp && serverIp !== 'Carregando...'
  const url = `http://${serverIp}:${serverPort}`

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <header
      className="relative z-50 flex items-center justify-between px-5 py-2.5"
      style={{
        borderBottom: '1px solid var(--vs-border)',
        background: 'rgba(10,10,15,0.9)',
        backdropFilter: 'blur(20px)',
        minHeight: '52px',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div
          className="relative flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs text-white"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4338CA)',
            boxShadow: '0 0 14px rgba(99,102,241,0.5)',
          }}
        >
          Vs
        </div>
        <div>
          <h1 className="text-sm font-bold leading-none tracking-tight text-white">
            ViewSync
          </h1>
        </div>
      </div>

      {/* Center — Server Address com botão de copiar */}
      {showAddress && !isStreaming && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid var(--vs-border-accent)',
          }}
        >
          <Globe className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--vs-accent)' }} />
          <span className="text-xs font-bold" style={{ color: 'var(--vs-text-muted)' }}>
            Acesso:{' '}
          </span>
          <span
            className="text-xs font-black"
            style={{ color: 'var(--vs-neon)', fontFamily: 'var(--font-mono)' }}
          >
            {url}
          </span>
          {/* Botão copiar */}
          <button
            onClick={copyUrl}
            title={copied ? 'Copiado!' : 'Copiar endereço'}
            className="p-1 rounded-md cursor-pointer transition-all duration-200 active:scale-90"
            style={{
              background: copied ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
              color: copied ? 'var(--vs-neon)' : 'var(--vs-text-muted)',
              border: `1px solid ${copied ? 'var(--vs-border-accent)' : 'var(--vs-border)'}`,
            }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Network name */}
        {networkName && networkName !== 'Detectando...' && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--vs-border)',
              color: 'var(--vs-text-muted)',
            }}
          >
            <Radio className="w-3 h-3" style={{ color: 'var(--vs-accent)' }} />
            {networkName}
          </div>
        )}

        {/* Status pill */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
          style={{
            background: isConnected ? 'rgba(99,102,241,0.08)' : 'rgba(244,63,94,0.08)',
            border: `1px solid ${isConnected ? 'rgba(99,102,241,0.25)' : 'rgba(244,63,94,0.25)'}`,
            color: isConnected ? 'var(--vs-neon)' : 'var(--vs-danger)',
          }}
        >
          <Activity className="w-3 h-3" />
          {isConnected ? 'Server On' : 'Conectando'}
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: isConnected ? 'var(--vs-accent)' : 'var(--vs-danger)',
              boxShadow: isConnected ? '0 0 6px var(--vs-accent-glow)' : 'none',
            }}
          />
        </div>

        {/* Stop button — only shown when streaming */}
        {isStreaming && onStopStream && (
          <button
            onClick={onStopStream}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all duration-200 active:scale-95"
            style={{
              background: 'rgba(244,63,94,0.12)',
              border: '1px solid rgba(244,63,94,0.3)',
              color: 'var(--vs-danger)',
            }}
          >
            <Square className="w-3 h-3 fill-current" />
            Encerrar
          </button>
        )}
      </div>
    </header>
  )
}
