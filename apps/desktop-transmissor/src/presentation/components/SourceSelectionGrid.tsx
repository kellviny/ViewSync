import { useState } from 'react'
import { CheckCircle2, Monitor, ShieldAlert } from 'lucide-react'
import type { ScreenAccessStatus } from '../../infrastructure/types/window'
import type { DesktopSource } from '../../domain/models/DesktopSource'

export const SourceSelectionGrid = ({
  sources,
  selectedSource,
  onSelectSource,
  screenAccess = 'granted',
  onRequestScreenAccess,
  onRestartApp,
}: {
  sources: DesktopSource[]
  selectedSource: string | null
  onSelectSource: (sourceId: string) => void
  screenAccess?: ScreenAccessStatus
  onRequestScreenAccess?: (openSettings: boolean) => void
  onRestartApp?: () => void
}) => {
  // Depois do primeiro clique o pedido já está registrado: clicar de novo só
  // faria o macOS repetir o alerta, então o botão sai de cena.
  const [requested, setRequested] = useState(false)

  return (
  <div className="animate-fade-up space-y-5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--vs-accent-dim)', border: '1px solid var(--vs-border-accent)' }}>
        <Monitor className="w-4 h-4" style={{ color: 'var(--vs-neon)' }} />
      </div>
      <div>
        <h2 className="text-sm font-bold tracking-tight text-white">Selecionar Fonte</h2>
        <p className="text-[10px] font-medium" style={{ color: 'var(--vs-text-muted)' }}>
          Escolha a tela ou janela para transmitir
        </p>
      </div>
    </div>

    {screenAccess !== 'granted' ? (
      <div
        className="rounded-xl p-5 space-y-3"
        style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.25)' }}
      >
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4" style={{ color: 'var(--vs-danger, #f43f5e)' }} />
          <h3 className="text-sm font-bold text-white">Permissão de Gravação de Tela necessária</h3>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--vs-text-muted)' }}>
          O macOS precisa autorizar o LanView a capturar a tela. Autorize em
          <strong> Ajustes do Sistema › Privacidade e Segurança › Gravação de Tela</strong>.
          Depois de marcar o LanView na lista, use <strong>Reiniciar o app</strong> — o
          macOS não aplica a autorização ao processo que já está aberto.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRequested(true)
              onRequestScreenAccess?.(true)
            }}
            disabled={requested}
            className="px-3 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-default"
            style={{ background: 'var(--vs-accent-dim)', border: '1px solid var(--vs-border-accent)', color: 'white' }}
          >
            {requested ? 'Aguardando autorização…' : 'Abrir Ajustes do Sistema'}
          </button>
          <button
            onClick={() => onRequestScreenAccess?.(false)}
            className="px-3 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--vs-border)', color: 'var(--vs-text-muted)' }}
          >
            Já autorizei — verificar
          </button>
          <button
            onClick={() => onRestartApp?.()}
            className="px-3 py-2 rounded-lg text-xs font-bold transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--vs-border)', color: 'var(--vs-text-muted)' }}
          >
            Reiniciar o app
          </button>
        </div>
      </div>
    ) : sources.length === 0 ? (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--vs-border)' }}>
            <div className="aspect-video shimmer" />
            <div className="p-3">
              <div className="shimmer h-2.5 rounded-full w-3/4" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {sources.map((source, idx) => {
          const isSelected = selectedSource === source.id
          return (
            <div
              key={source.id}
              onClick={() => onSelectSource(source.id)}
              className="group cursor-pointer rounded-xl overflow-hidden transition-all duration-200 animate-fade-up"
              style={{
                animationDelay: `${idx * 40}ms`,
                border: `1px solid ${isSelected ? 'var(--vs-accent)' : 'var(--vs-border)'}`,
                background: isSelected ? 'var(--vs-accent-dim)' : 'var(--vs-bg-card)',
                boxShadow: isSelected ? 'var(--vs-glow-sm)' : 'none',
                transform: isSelected ? 'scale(1.02)' : undefined,
              }}
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                <img
                  src={source.thumbnail}
                  alt={source.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  style={{ opacity: isSelected ? 1 : 0.7 }}
                />
                {/* Overlay hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: 'rgba(99,102,241,0.1)' }} />

                {/* Selected check */}
                {isSelected && (
                  <div className="absolute inset-0 flex items-center justify-center animate-scale-in"
                    style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--vs-accent)', boxShadow: 'var(--vs-glow-md)' }}>
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
              <div className="px-3 py-2.5 flex items-center gap-2">
                <Monitor className="w-3 h-3 flex-shrink-0"
                  style={{ color: isSelected ? 'var(--vs-neon)' : 'var(--vs-text-muted)' }} />
                <span className="text-xs font-semibold truncate"
                  style={{ color: isSelected ? 'var(--vs-text)' : 'var(--vs-text-muted)' }}>
                  {source.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )}
    </div>
  )
}
