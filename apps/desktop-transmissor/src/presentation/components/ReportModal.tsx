import { Download, X, Clock, Users, Trophy } from 'lucide-react'
import { useState } from 'react'

export type StreamReport = {
  durationMs: number
  averageTimeMs: number
  minViewer: { enrollment: string; name: string; totalTimeMs: number } | null
  maxViewer: { enrollment: string; name: string; totalTimeMs: number } | null
  viewers: { enrollment: string; name: string; totalTimeMs: number }[]
}

const formatMs = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export const ReportModal = ({
  report,
  onClose,
}: {
  report: StreamReport
  onClose: () => void
}) => {
  const [filename, setFilename] = useState('Relatorio_Aula')

  const handleDownload = () => {
    const text = `
RELATÓRIO DE TRANSMISSÃO - LAN VIEW
===================================
Duração Total: ${formatMs(report.durationMs)}
Tempo Médio Assistido: ${formatMs(report.averageTimeMs)}
Total de Alunos Únicos: ${report.viewers.length}

DESTAQUES:
- Maior tempo: ${report.maxViewer ? `${report.maxViewer.name} (${formatMs(report.maxViewer.totalTimeMs)})` : 'Nenhum'}
- Menor tempo: ${report.minViewer ? `${report.minViewer.name} (${formatMs(report.minViewer.totalTimeMs)})` : 'Nenhum'}

LISTA COMPLETA DE PRESENÇA:
${report.viewers.map(v => `${v.enrollment} - ${v.name}: ${formatMs(v.totalTimeMs)}`).join('\n')}
    `.trim()

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(2,4,10,0.85)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-in"
        style={{
          background: 'linear-gradient(180deg, rgba(15,19,30,0.98), rgba(8,10,16,0.98))',
          border: '1px solid var(--vs-border-accent)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--vs-border)' }}>
          <h3 className="text-sm font-black tracking-wider uppercase text-white flex items-center gap-2">
            <Trophy className="w-4 h-4" style={{ color: 'var(--vs-accent)' }} />
            Resumo da Sessão
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl p-4 flex flex-col gap-1 bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-cyan-400" /> Duração
              </span>
              <span className="text-xl font-black text-white">{formatMs(report.durationMs)}</span>
            </div>
            <div className="rounded-xl p-4 flex flex-col gap-1 bg-white/5 border border-white/10">
              <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                <Users className="w-3 h-3 text-indigo-400" /> Alunos
              </span>
              <span className="text-xl font-black text-white">{report.viewers.length}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Nome do Relatório para Salvar</label>
            <input
              type="text"
              className="vs-input w-full bg-black/50"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Ex: Aula 01 - Matematica"
            />
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm text-white transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #4338CA)',
              boxShadow: 'var(--vs-glow-md)',
            }}
          >
            <Download className="w-4 h-4" />
            BAIXAR RELATÓRIO (.TXT)
          </button>
        </div>
      </div>
    </div>
  )
}
