import { useTransmissorController } from '../hooks/useTransmissorController'
import { SourceSelectionGrid } from '../components/SourceSelectionGrid'
import { StreamSettingsBar } from '../components/StreamSettingsBar'
import { StreamingPanel } from '../components/StreamingPanel'
import { StudioHeader } from '../components/StudioHeader'
import { ReportModal } from '../components/ReportModal'
import { Shield } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

export const TransmissorPage = () => {
  const {
    copied,
    copyUrl,
    fps,
    isConnected,
    isStarting,
    isStreaming,
    networkName,
    networkInterfaces,
    adminToken,
    streamReport,
    setStreamReport,
    onStartStream,
    onStopStream,
    setPrivacyShield,
    onSetNetwork,
    password,
    roomState,
    screenAccess,
    requestScreenAccess,
    restartApp,
    selectedSource,
    serverIp,
    serverPort,
    setFps,
    setPassword,
    setSelectedSource,
    sources,
    videoRef,
  } = useTransmissorController()

  return (
    <div
      className="flex flex-col h-screen select-none"
      style={{ background: 'var(--vs-bg-base)', color: 'var(--vs-text)' }}
    >
      {/* Header — always visible; shows IP and stop button when streaming */}
      <StudioHeader
        isConnected={isConnected}
        isStreaming={isStreaming}
        networkName={networkName}
        serverIp={serverIp}
        serverPort={serverPort}
        onStopStream={onStopStream}
      />

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto space-y-4">

          {/* Settings bar — hides itself when isStreaming */}
          <StreamSettingsBar
            fps={fps}
            password={password}
            isStreaming={isStreaming}
            isStarting={isStarting}
            canStart={!!selectedSource}
            networkInterfaces={networkInterfaces}
            serverIp={serverIp}
            onChangeFps={setFps}
            onChangePassword={setPassword}
            onSetNetwork={onSetNetwork}
            onStartStream={onStartStream}
          />

          {/* Main content */}
          {isStreaming ? (
            <StreamingPanel
              copied={copied}
              fps={fps}
              networkName={networkName}
              password={password}
              adminToken={adminToken}
              roomState={roomState}
              selectedSource={selectedSource}
              serverIp={serverIp}
              serverPort={serverPort}
              sources={sources}
              videoRef={videoRef}
              onCopyUrl={copyUrl}
              onSelectSource={setSelectedSource}
              onPrivacyShield={setPrivacyShield}
            />
          ) : (
            <div className="flex gap-6 items-start">
              <div className="flex-1">
                <SourceSelectionGrid
                  sources={sources}
                  selectedSource={selectedSource}
                  onSelectSource={setSelectedSource}
                  screenAccess={screenAccess}
                  onRequestScreenAccess={requestScreenAccess}
                  onRestartApp={restartApp}
                />
              </div>
              
              {/* QR Code sidebar shown before starting */}
              <div className="w-[280px] animate-fade-up shrink-0">
                <div className="rounded-2xl p-6 flex flex-col items-center text-center gap-4" style={{ background: 'var(--vs-bg-card)', border: '1px solid var(--vs-border)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-500/20 border border-indigo-500/30">
                    <Shield className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      {import.meta.env.VITE_APP_MODE === 'institutional' ? 'Painel do Professor' : 'Acesso da Sala'}
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      {import.meta.env.VITE_APP_MODE === 'institutional'
                        ? 'Gerencie a sala pelo seu celular'
                        : 'Escaneie para acessar a transmissão'}
                    </p>
                  </div>
                  <div className="p-3 bg-white rounded-xl">
                    <QRCodeSVG
                      value={
                        import.meta.env.VITE_APP_MODE === 'institutional' && adminToken
                          ? `http://${serverIp}:${serverPort}/admin#${adminToken}`
                          : `http://${serverIp}:${serverPort}`
                      }
                      size={160}
                    />
                  </div>

                  <p className="text-[10px] text-gray-500 text-center font-mono break-all w-full px-2 mt-1">
                    {import.meta.env.VITE_APP_MODE === 'institutional' && adminToken
                      ? `http://${serverIp}:${serverPort}/admin#${adminToken}`
                      : `http://${serverIp}:${serverPort}`}
                  </p>

                  <button 
                    onClick={() => {
                      const targetUrl = import.meta.env.VITE_APP_MODE === 'institutional' && adminToken
                        ? `http://${serverIp}:${serverPort}/admin#${adminToken}`
                        : `http://${serverIp}:${serverPort}`
                      navigator.clipboard.writeText(targetUrl)
                      alert(import.meta.env.VITE_APP_MODE === 'institutional' ? 'Link de admin copiado!' : 'Link da sala copiado!')
                    }}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {import.meta.env.VITE_APP_MODE === 'institutional' ? 'Copiar Link Admin' : 'Copiar Link da Sala'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {streamReport && (
        <ReportModal
          report={streamReport}
          onClose={() => setStreamReport(null)}
        />
      )}

      <footer
        className="px-5 py-2 text-center text-[9px] font-bold uppercase tracking-[0.3em]"
        style={{
          color: 'var(--vs-text-dim)',
          borderTop: '1px solid var(--vs-border)',
          background: 'rgba(0,0,0,0.2)',
          fontFamily: 'var(--font-mono)',
        }}
      >
        © 2026 Lan View &bull; by Kellviny
      </footer>
    </div>
  )
}
