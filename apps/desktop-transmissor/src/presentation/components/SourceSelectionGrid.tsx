import { CheckCircle2, Monitor } from 'lucide-react'
import type { DesktopSource } from '../../domain/models/DesktopSource'

export const SourceSelectionGrid = ({ sources, selectedSource, onSelectSource }: {
  sources: DesktopSource[]
  selectedSource: string | null
  onSelectSource: (sourceId: string) => void
}) => (
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

    {sources.length === 0 ? (
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
