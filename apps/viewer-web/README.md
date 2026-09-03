# Lan View — Viewer Web 🌐📱

O **Viewer Web** é a aplicação cliente do Lan View desenvolvida em **Next.js** e **React**. Ela é executada diretamente no navegador dos alunos/espectadores (laptops, celulares, tablets, smart TVs) para receber a transmissão da tela via WebRTC em tempo real com ultrabaixa latência.

---

## 🌟 Funcionalidades

- **⚡ Ultrabaixa Latência**: Conexão WebRTC direta com o SFU (*Mediasoup*) rodando no computador do apresentador.
- **🎯 Sincronização Inteligente (Zero Latency Catch-up)**: Monitora constantemente o atraso de buffer e ajusta dinamicamente a taxa de reprodução de vídeo para eliminar qualquer *drift* de atraso.
- **📱 100% Responsivo & Mobile-Ready**: Interface moderna que se adapta automaticamente a celulares, tablets e desktops.
- **🔋 Otimização de Recursos**: Pausa o consumo de mídia automaticamente caso a aba seja minimizada ou perca o foco, economizando bateria e tráfego na rede local.
- **🔒 Autenticação por PIN**: Suporte a salas protegidas com código de acesso.

---

## 🛠️ Tecnologias

- **Framework:** Next.js (com Static Export / SSG para pasta `out/`)
- **UI:** React 19, Tailwind CSS, Lucide Icons
- **Mídia:** `mediasoup-client`, `socket.io-client`

---

## 🚀 Desenvolvimento e Build

### Modo de Desenvolvimento Isolado (Web)

```bash
# Na raiz do monorepo
npm run dev --workspace=viewer-web

# Ou entrando na pasta
cd apps/viewer-web
npm run dev
```

Acesse em: `http://localhost:3000`

### Build para Produção (Export Estático)

```bash
# Na raiz do monorepo
npm run build --workspace=viewer-web
```

*Os arquivos estáticos (HTML/CSS/JS) são gerados na pasta `apps/viewer-web/out/`. Essa pasta é empacotada junto com o aplicativo desktop do Electron e servida automaticamente na porta `3001` da rede local.*

---

Desenvolvido por **Kellviny** • 2026

