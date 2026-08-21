import { Maximize, Minimize, Play, Users } from 'lucide-react'
import type { RefObject } from 'react'

export const VideoPlayer = ({
  videoRef,
  containerRef,
  connectedCount,
  isFullScreen,
  needsForcePlay,
  onToggleFullScreen,
  onForcePlay,
  onContainerClick,
}: {
  videoRef: RefObject<HTMLVideoElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  connectedCount: number
  isFullScreen: boolean
  needsForcePlay: boolean
  onToggleFullScreen: () => void
  onForcePlay: () => void
  onContainerClick: () => void
}) => (
  <div
    ref={containerRef}
    className="relative w-full h-full group flex items-center justify-center overflow-hidden"
    style={{ background: '#000' }}
    onClick={onContainerClick}
  >
    {/* Ambient glow behind video */}
    <div className="absolute inset-0 pointer-events-none"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%)',
      }} />

    {/* Status overlay */}
    <div
      id="status-overlay"
      className={`absolute z-40 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col gap-2 ${isFullScreen ? 'top-4 left-4' : 'top-16 left-4'}`}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold"
        style={{
          background: 'rgba(10,10,15,0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--vs-border)',
        }}>
        <Users className="w-3.5 h-3.5" style={{ color: 'var(--vs-accent)' }} />
        <span style={{ color: 'var(--vs-text-muted)' }}>
          <span className="text-white font-black">{connectedCount}</span> na sala
        </span>
      </div>
    </div>

    {/* Video element */}
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-contain pointer-events-none"
    />

    {/* Force play overlay */}
    {needsForcePlay && (
      <div className="absolute inset-0 z-50 flex items-center justify-center animate-fade-up"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onForcePlay() }}
          className="group/btn flex items-center justify-center w-20 h-20 rounded-full cursor-pointer transition-all duration-200 active:scale-90"
          style={{
            background: 'rgba(99,102,241,0.15)',
            border: '2px solid rgba(99,102,241,0.4)',
            boxShadow: 'var(--vs-glow-md)',
          }}>
          <Play className="w-8 h-8 text-white fill-white transition-transform duration-200 group-hover/btn:scale-110" />
        </button>
      </div>
    )}

    {/* Floating controls */}
    <div
      id="floating-controls"
      className={`absolute z-50 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 ${isFullScreen ? 'bottom-6 right-6' : 'bottom-12 right-6'}`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFullScreen() }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200 active:scale-90"
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--vs-border)',
          color: 'var(--vs-text-muted)',
        }}>
        {isFullScreen
          ? <Minimize className="w-4 h-4" />
          : <Maximize className="w-4 h-4" />}
        <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">
          {isFullScreen ? 'Sair' : 'Expandir'}
        </span>
      </button>
    </div>

    {/* Desktop frame border */}
    {!isFullScreen && (
      <div className="absolute inset-0 border-[10px] pointer-events-none hidden md:block rounded-[2.5rem]"
        style={{ borderColor: 'var(--vs-bg-base)' }} />
    )}
  </div>
)
