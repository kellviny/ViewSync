import { Radio } from 'lucide-react'

export const WaitingScreen = () => (
  <div className="flex flex-col items-center justify-center gap-8 px-6 animate-fade-up">

    {/* Ambient orb + orbital animation */}
    <div className="relative w-32 h-32 flex items-center justify-center">
      {/* Outer glow ring */}
      <div className="absolute inset-0 rounded-full animate-ambient"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        }} />
      {/* Mid ring */}
      <div className="absolute inset-4 rounded-full"
        style={{ border: '1px solid rgba(99,102,241,0.15)' }} />
      {/* Inner ring */}
      <div className="absolute inset-8 rounded-full"
        style={{ border: '1px solid rgba(99,102,241,0.1)' }} />
      {/* Center icon */}
      <div className="relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          boxShadow: '0 0 30px rgba(99,102,241,0.2)',
        }}>
        <Radio className="w-7 h-7" style={{ color: 'var(--vs-neon)' }} />
      </div>
      {/* Orbiting dot */}
      <div className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'vs-glow-orbit 4s linear infinite' }}>
        <span className="w-2 h-2 rounded-full"
          style={{ background: 'var(--vs-accent)', boxShadow: '0 0 8px var(--vs-accent-glow)' }} />
      </div>
    </div>

    {/* Text */}
    <div className="text-center space-y-3 max-w-xs">
      <h2 className="text-xl font-bold text-white tracking-tight">Sala de Aula Digital</h2>
      <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--vs-text-muted)' }}>
        Aguardando o professor iniciar a transmissão...
      </p>
      {/* Shimmer status bar */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1 rounded-full shimmer"
            style={{
              width: i === 1 ? '2rem' : '0.75rem',
              animationDelay: `${i * 0.3}s`,
              opacity: 0.5,
            }} />
        ))}
      </div>
    </div>
  </div>
)
