import { BadgeCheck, IdCard, UserRound } from 'lucide-react'

export const ViewerIdentityModal = ({
  viewerEnrollment,
  viewerName,
  error,
  passwordValue,
  roomHasPassword,
  onEnrollmentChange,
  onNameChange,
  onPasswordChange,
  onContinue,
}: {
  viewerEnrollment: string
  viewerName: string
  error: string
  passwordValue: string
  roomHasPassword: boolean
  onEnrollmentChange: (value: string) => void
  onNameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onContinue: () => void
}) => (
  <div className="w-full max-w-sm mx-auto px-5 animate-scale-in">
    <div
      className="rounded-3xl p-8 space-y-6"
      style={{
        background: 'rgba(15,15,26,0.9)',
        backdropFilter: 'blur(30px)',
        border: '1px solid var(--vs-border)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
      }}
    >
      <div className="text-center">
        <div
          className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
          style={{
            background: 'var(--vs-accent-dim)',
            border: '1px solid var(--vs-border-accent)',
            boxShadow: 'var(--vs-glow-sm)',
          }}
        >
          <BadgeCheck className="w-7 h-7" style={{ color: 'var(--vs-neon)' }} />
        </div>
        <h2 className="text-xl font-black text-white tracking-tight">
          {process.env.NEXT_PUBLIC_APP_MODE === 'institutional' ? 'Identificação Institucional' : 'Entrar na Transmissão'}
        </h2>
        <p className="text-sm mt-1.5 font-medium" style={{ color: 'var(--vs-text-muted)' }}>
          {process.env.NEXT_PUBLIC_APP_MODE === 'institutional'
            ? 'Informe sua matrícula e nome completo'
            : 'Digite seu nome ou apelido para continuar'}
        </p>
      </div>

      <div className="space-y-3">
        {/* Matrícula (exibida apenas no Modo Institucional ou se opcional) */}
        {process.env.NEXT_PUBLIC_APP_MODE === 'institutional' && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--vs-text-muted)' }}>
              <IdCard className="w-3.5 h-3.5" />
              Matrícula
            </label>
            <input
              type="text"
              placeholder="Ex: 2024123ABCD1234"
              className="vs-input"
              value={viewerEnrollment}
              onChange={(event) => onEnrollmentChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onContinue()}
              maxLength={15}
              autoFocus
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--vs-text-muted)' }}>
            <UserRound className="w-3.5 h-3.5" />
            {process.env.NEXT_PUBLIC_APP_MODE === 'institutional' ? 'Nome completo' : 'Seu Nome / Apelido'}
          </label>
          <input
            type="text"
            placeholder={process.env.NEXT_PUBLIC_APP_MODE === 'institutional' ? 'Nome completo' : 'Ex: João Silva'}
            className="vs-input"
            value={viewerName}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onContinue()}
            maxLength={80}
            autoFocus={process.env.NEXT_PUBLIC_APP_MODE !== 'institutional'}
          />
        </div>

        {/* Campo de Senha (apenas no modo normal se a sala possuir senha) */}
        {process.env.NEXT_PUBLIC_APP_MODE !== 'institutional' && roomHasPassword && (
          <div className="space-y-1.5 animate-scale-in">
            <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--vs-text-muted)' }}>
              <span className="w-3.5 h-3.5 flex items-center justify-center font-bold text-lg" style={{ color: 'var(--vs-text-muted)', lineHeight: 1 }}>*</span>
              Senha da Sala
            </label>
            <input
              type="password"
              placeholder="Digite a senha"
              className="vs-input"
              value={passwordValue}
              onChange={(event) => onPasswordChange(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && onContinue()}
            />
          </div>
        )}

        {error && (
          <div
            className="py-2.5 px-4 rounded-xl text-xs font-bold text-center animate-fade-up"
            style={{
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.2)',
              color: 'var(--vs-danger)',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl font-black text-sm text-white cursor-pointer transition-all duration-200 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #6366F1, #4338CA)',
            boxShadow: 'var(--vs-glow-md)',
          }}
        >
          CONTINUAR
        </button>
      </div>
    </div>
  </div>
)