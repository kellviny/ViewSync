import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ViewSync — Sala de Aula Digital',
  description: 'Sistema premium de transmissão de tela para educação em rede local',
  icons: { icon: '/logo.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full overflow-hidden antialiased" style={{ fontFamily: 'var(--font-body)' }}>
        {children}
      </body>
    </html>
  )
}
