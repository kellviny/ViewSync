'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Shield, Eye, Radio } from 'lucide-react'

// Utilizando componentes locais, simulando o layout
export default function AdminDashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [error, setError] = useState('')
  const [roomState, setRoomState] = useState<any>(null)
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    // Só roda no cliente, pegando da URL o token escondido (ex: /admin#MY_TOKEN)
    const urlToken = window.location.hash.replace('#', '')
    if (!urlToken) {
      setError('Token não fornecido na URL.')
      return
    }
    setToken(urlToken)

    const s = io()
    setSocket(s)

    s.on('connect', () => {
      s.emit('admin:join', { token: urlToken }, (res: any) => {
        if (!res.success) {
          setError(res.error)
        } else {
          setRoomState(res.state)
        }
      })
    })

    s.on('room:state_update', (state) => {
      setRoomState(state)
    })

    s.on('host:stream_report', (rep) => {
      setReport(rep)
    })

    return () => {
      s.disconnect()
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#02040A' }}>
        <div className="text-center space-y-4">
          <Shield className="w-12 h-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-black text-white uppercase tracking-widest">Acesso Negado</h1>
          <p className="text-sm text-gray-400 font-bold">{error}</p>
        </div>
      </div>
    )
  }

  if (!roomState && !report) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#02040A' }}>
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
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

  return (
    <div className="min-h-screen p-5 animate-fade-in" style={{ background: '#02040A' }}>
      <header className="flex items-center gap-3 mb-8 pb-4 border-b border-white/10">
        <Shield className="w-6 h-6 text-indigo-400" />
        <h1 className="text-lg font-black uppercase tracking-widest text-white">Painel do Professor</h1>
      </header>

      {report ? (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-4">Relatório Final</h2>
            <div className="space-y-2 text-sm text-white font-bold">
              <p>Duração: {formatMs(report.durationMs)}</p>
              <p>Tempo Médio: {formatMs(report.averageTimeMs)}</p>
              <p>Total Alunos: {report.viewers?.length || 0}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Lista de Presença</h3>
            {report.viewers?.map((v: any) => (
              <div key={v.enrollment} className="flex justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xs font-bold text-white">{v.enrollment} - {v.name}</span>
                <span className="text-xs font-bold text-cyan-400">{formatMs(v.totalTimeMs)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2">
              <Radio className="w-5 h-5 text-indigo-400" />
              <span className="text-3xl font-black text-white">{roomState?.connectedCount || 0}</span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Na Rede</span>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-cyan-500/30 flex flex-col items-center justify-center gap-2" style={{ boxShadow: 'inset 0 0 20px rgba(34,211,238,0.05)' }}>
              <Eye className="w-5 h-5 text-cyan-400" />
              <span className="text-3xl font-black text-white">{roomState?.activeViewersCount || 0}</span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Assistindo</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Alunos Registrados</h3>
            {roomState?.viewers?.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">Nenhum aluno registrado.</p>
            ) : (
              roomState?.viewers?.map((v: any) => (
                <div key={v.enrollment} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-xs font-bold text-white uppercase">{v.enrollment} - {v.name}</span>
                  
                  <div className="flex items-center gap-2">
                    {v.isViewing ? (
                      <span className="px-2 py-1 rounded-md text-[9px] font-black tracking-wider bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        ASSISTINDO
                      </span>
                    ) : v.isOnline ? (
                      <span className="px-2 py-1 rounded-md text-[9px] font-black tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        CONECTADO
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md text-[9px] font-black tracking-wider bg-white/5 text-gray-500 border border-white/10 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                        DESCONECTADO
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
