# ViewSync Studio — Transmissor Desktop

Aplicação **Electron** usada pelo professor para capturar e transmitir a tela em tempo real via WebRTC/Mediasoup para qualquer navegador na rede local.

---

## Visão Geral

```
┌─────────────────────────────┐       LAN        ┌────────────────────┐
│   ViewSync Studio (Electron) │ ────────────────► │  Viewer (Browser)  │
│  ┌──────────┐  ┌──────────┐  │                  │  http://<IP>:3000  │
│  │  React UI │  │ Mediasoup│  │  Socket.IO +     └────────────────────┘
│  │ (Renderer)│  │  Server  │  │  WebRTC (UDP)
│  └──────────┘  └──────────┘  │
└─────────────────────────────┘
```

O Studio inicializa um **servidor HTTP interno** (porta 3000) que:

- Expõe sinalização WebRTC via **Socket.IO**
- Publica o vídeo usando **Mediasoup** (SFU — Selective Forwarding Unit)
- Serve o cliente Viewer estático em `/`
- Aceita múltiplos espectadores simultâneos sem re-encoding

---

## Arquitetura do Projeto

O projeto segue princípios de **Domain-Driven Design (DDD)** separados em camadas:

```
src/
├── domain/             # Modelos e contratos de negócio puros
│   └── models/         # DesktopSource, RoomState, ServerInfo, StreamConfig
│
├── application/        # Casos de uso e portas (interfaces)
│   ├── ports/          # DesktopSourcesPort, ProducerPort, SignalingPort, ...
│   └── usecases/       # refreshSources, startStream, stopStream, switchSource
│
├── infrastructure/     # Implementações concretas (Electron, mediasoup-client)
│   ├── clipboard/      # ClipboardAdapter (navigator.clipboard)
│   ├── desktop/        # ElectronDesktopSourcesAdapter (IPC → desktopCapturer)
│   ├── signaling/      # SocketIOSignalingAdapter (socket.io-client)
│   ├── streaming/      # MediasoupProducerAdapter (mediasoup-client)
│   └── types/          # window.d.ts — declarações globais do preload
│
├── app/
│   └── compositionRoot.ts  # Monta todas as dependências (DI manual)
│
└── presentation/       # React UI
    ├── components/     # StudioHeader, StreamSettingsBar, StreamingPanel, ...
    ├── hooks/          # useTransmissorController (orquestra toda a UI)
    └── pages/          # TransmissorPage

electron/
├── main.ts             # Main process: janela, IPC handlers, fork do servidor
├── preload.ts          # Bridge segura via contextBridge
└── server.ts           # Servidor HTTP + Socket.IO + Mediasoup (forked process)
```

---

## Fluxo do Electron

```
app.whenReady()
  │
  ├─ setupIPCHandlers()     ← registra get-desktop-sources e get-network-info
  ├─ startInternalServer()  ← fork(dist-electron/server.js)
  └─ createWindow()         ← BrowserWindow com preload.js
```

O servidor é executado em um **processo filho separado** via `child_process.fork()`, garantindo que o crash do Mediasoup não derrube a janela principal.

---

## Fluxo de Transmissão WebRTC (Mediasoup)

```
Renderer                    Server (fork)
   │                             │
   │── socket: host:start_stream ──►│  roomState.isStreaming = true
   │                             │
   │── mediasoup:getRouterRtpCapabilities ──►│
   │◄── rtpCapabilities ─────────│
   │                             │
   │── mediasoup:createWebRtcTransport ──►│
   │◄── { id, iceParameters, ... } ──────│
   │                             │
   │  device.createSendTransport()       │
   │                             │
   │── mediasoup:connectWebRtcTransport ──►│  transport.connect()
   │── mediasoup:produce ────────────────►│  transport.produce()
   │◄── { producerId } ──────────│
   │                             │
   │  [ICE/DTLS handshake UDP]   │
   │◄═══════════════════════════►│  stream ativo
```

---

## Fluxo de IPC (Main ↔ Renderer)

| Canal IPC            | Direção         | Descrição                                      |
|----------------------|-----------------|------------------------------------------------|
| `get-desktop-sources`| Renderer → Main | Lista janelas/telas via `desktopCapturer`      |
| `get-network-info`   | Renderer → Main | Fallback legacy (info real vem via socket.io)  |

O `preload.ts` expõe `window.mirrorAPI` com esses métodos via `contextBridge`.  
As informações de rede reais (`ip`, `port`, `network`) chegam pelo evento `server:info` do Socket.IO.

---

## Requisitos

- **Node.js 20+**
- **Python 3.x** (para compilar módulos nativos do Mediasoup)
- **Ferramentas de build C/C++:**
  - **Windows:** Visual Studio Build Tools (`npm install --global windows-build-tools` ou instalar via VS Installer)
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux:** `build-essential`, `python3`

---

## Desenvolvimento

### Iniciando em modo dev (pelo monorepo):

```bash
# Na raiz do monorepo
npm run start:desktop
```

### Iniciando diretamente:

```bash
cd apps/desktop-transmissor
npm run dev
```

O Vite compila o React e o Electron simultaneamente via `vite-plugin-electron`. A aplicação abre automaticamente.

---

## Build

O build completo inclui compilar o Viewer web, depois o Studio:

```bash
# Build completo (inclui viewer-web)
npm run build --workspace=view-sync-desktop

# Somente Windows (sem viewer)
npm run build:win

# Somente macOS (requer máquina macOS ou CI cross-compile)
npm run build:mac
```

O artefato final é gerado em `release/`.

---

## Verificação de Tipos

```bash
npm run typecheck
```

Deve retornar **sem erros**.

---

## Módulos Nativos (Mediasoup)

O Mediasoup compila um worker nativo em C++. Após instalar dependências ou mudar a versão do Electron:

```bash
# Recompilar o Mediasoup para o ABI do Electron atual
npm run rebuild:native

# Se o worker estiver corrompido, limpa e recompila
npm run clean:native
```

> **Atenção:** O `asar: false` no `package.json` é **obrigatório** para que o worker do Mediasoup seja executado corretamente após o empacotamento.

---

## Estrutura de Pastas Completa

```
apps/desktop-transmissor/
├── electron/           # Main process (Node.js)
├── public/             # Assets estáticos (ícones)
├── src/                # Renderer process (React)
├── dist/               # Build do Renderer (gerado)
├── dist-electron/      # Build do Main/Preload/Server (gerado)
├── release/            # Instaladores finais (gerado)
├── package.json
├── vite.config.ts
├── tsconfig.json       # Configuração React (src/)
└── tsconfig.node.json  # Configuração Node/Electron (electron/)
```

---

## Troubleshooting

### ❌ Mediasoup falha ao iniciar com código de saída não-zero

**Causa:** Worker nativo compilado para ABI incorreto.  
**Solução:**
```bash
npm run rebuild:native
```

### ❌ Tela preta ao iniciar a transmissão

**Causa:** Permissões de captura de tela negadas (macOS Catalina+).  
**Solução:** Ir em *Preferências do Sistema → Privacidade e Segurança → Gravação de Tela* e adicionar o ViewSync Studio.

### ❌ Viewer não conecta

**Causa:** Firewall bloqueando a porta 3000 ou portas UDP 40000–41000.  
**Solução:** Liberar as portas no firewall do sistema. Ambos os dispositivos devem estar na **mesma rede local**.

### ❌ `Cannot find module 'mediasoup-client/lib/...'`

**Causa:** Importações de caminhos internos do mediasoup-client mudaram entre versões.  
**Solução:** Usar apenas `import { types } from 'mediasoup-client'` e nunca importar de `lib/` diretamente.

### ❌ Erros de JSX `no interface 'JSX.IntrinsicElements'`

**Causa:** O `tsconfig.json` incluindo a pasta `electron/` mistura contexto Node com DOM, corrompendo a resolução do `@types/react`.  
**Solução:** Manter `electron/` apenas no `tsconfig.node.json` e `src/` apenas no `tsconfig.json`.

---

## Problemas Conhecidos

- Em algumas GPUs integradas, a captura via WGC (Windows Graphics Capture) pode causar artefatos. O app desativa WGC via flags de linha de comando por padrão.
- No macOS, o `hardenedRuntime` requer entitlements específicos para captura de tela — incluídos em `build/entitlements.mac.plist`.

---

## Autor

Desenvolvido por **Kellviny** · © 2026 ViewSync eii
