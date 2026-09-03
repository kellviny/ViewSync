# ViewSync (LanView) 🖥️🚀

[![Version](https://img.shields.io/badge/version-1.1.4-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

**ViewSync (LanView)** is a high-performance, ultra-low latency screen sharing system designed for educational institutions, classrooms, and enterprise environments. It uses a **Selective Forwarding Unit (SFU)** architecture powered by **Mediasoup** to broadcast high-framerate screens within a local network (LAN) from a host presenter to multiple concurrent viewers with zero cloud dependencies.

---

## 🌟 Key Features

- **⚡ Ultra-Low Latency Streaming**: WebRTC + Mediasoup SFU with hardware-accelerated screen capture and direct LAN routing.
- **🎯 Zero-Latency Catch-up**: Smart buffer synchronization on the viewer client to eliminate video lag accumulation over time.
- **🔄 Continuous Network Monitoring**: Real-time Wi-Fi/Ethernet/IP change detection that instantly broadcasts new network endpoints to connected clients without needing a restart.
- **🌐 Multi-Interface & QR Code Access**: Automatic detection of all available network interfaces with interactive QR codes for quick student connection.
- **🔒 PIN & Access Control**: Secure room protection with optional PIN codes, admin management, and participant moderation.
- **🔋 Smart Bandwidth & Resource Management**: Automatic pause/resume when viewer tabs lose focus, minimizing host and client resource consumption.
- **📦 Dual Packaging**: Windows NSIS Installer and single-file Portable standalone executable, plus macOS DMG support.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Core & Monorepo** | Node.js (v18+), TypeScript, NPM Workspaces |
| **Media & Signaling** | Mediasoup (SFU), WebRTC, Socket.IO, Express |
| **Desktop Host (Transmissor)** | Electron 30, Vite, React 19, Tailwind CSS |
| **Web Client (Viewer)** | Next.js (SSG / Static Export), React 19, Lucide Icons |

---

## 🏗️ Architecture

```
 ┌────────────────────────┐
 │   Presenter Desktop    │
 │ (Electron Host + SFU)  │
 └───────────┬────────────┘
             │ WebSockets (Signaling) & WebRTC (Mediasoup SFU)
   ┌─────────┴─────────┐
   │    Local Area     │
   │   Network (LAN)   │
   └──┬─────────────┬──┘
      │             │
┌─────▼─────┐ ┌─────▼─────┐
│  Viewer 1 │ │  Viewer N │
│ (Browser) │ │ (Browser) │
└───────────┘ └───────────┘
```

1. **Host (Desktop Transmissor)**: Captures screen/audio via Electron desktop capturer and serves as both the HTTP signaling server and Mediasoup SFU.
2. **Viewer (Web App)**: Static web application served directly from the host over LAN, supporting modern browsers on laptops, tablets, and phones.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or later
- **C++ Build Tools**: Required for compiling native Mediasoup worker binaries:
  - **Windows**: Visual Studio C++ Build Tools (*Desktop development with C++*)
  - **macOS**: `xcode-select --install`
  - **Linux**: `build-essential` and `python3`

For detailed environment setup, refer to [SETUP.md](SETUP.md).

---

### Quick Start (Development)

```bash
# 1. Install all dependencies
npm ci

# 2. Build the static viewer client
npm run build --workspace=viewer-web

# 3. Compile Mediasoup native modules for Electron
cd apps/desktop-transmissor
npm run rebuild:native
cd ../..

# 4. Start the desktop application in dev mode
npm run dev:normal
# or for institutional branding:
npm run dev:inst
```

---

## 📦 Building & Packaging

### Windows

```bash
# Build NSIS Installer + Portable Executable
npm run build:normal:win

# Institutional build
npm run build:inst:win
```
Outputs in `apps/desktop-transmissor/release/`:
- `LanView-Setup-Padrao-1.1.4-win-x64.exe` / `LanView-Setup-Institucional-1.1.4-win-x64.exe` (NSIS Installer)
- `LanView-Portable-Padrao-1.1.4-win-x64.exe` / `LanView-Portable-Institucional-1.1.4-win-x64.exe` (Standalone Portable)

O workflow `.github/workflows/build-windows.yml` gera os mesmos executáveis no GitHub Actions — automaticamente em tags `v*` ou manualmente em **Actions › Build Windows Releases › Run workflow** (com opção de escolher a variante).

### macOS

```bash
# Apple Silicon (M1/M2/M3/M4) — versão padrão
npm run build:normal:mac:arm64
```

```bash
# Apple Silicon (M1/M2/M3/M4) — versão institucional
npm run build:inst:mac:arm64
```

```bash
# Intel (x64) — versão institucional
npm run build:inst:mac:x64
```

Saídas em `apps/desktop-transmissor/release/`:
- `LanView-Institucional-1.1.4-mac-arm64.dmg`
- `LanView-Padrao-1.1.4-mac-arm64.dmg`

As duas variantes agora têm nomes distintos (`APP_VARIANT`), então gerar
institucional e padrão em sequência não sobrescreve mais o DMG anterior.

O workflow `.github/workflows/build-mac.yml` gera os mesmos DMGs no GitHub
Actions — automaticamente em tags `v*` ou manualmente em **Actions › Build
macOS Releases › Run workflow** (com opções para escolher a variante e incluir
ou não o build Intel).

#### Permissões do macOS

Na primeira execução o macOS pede duas autorizações e **não** as aplica ao
processo que já está rodando — era por isso que o app só funcionava depois de
fechar e abrir de novo:

| Permissão | Onde autorizar | Sintoma quando falta |
|---|---|---|
| **Gravação de Tela** | Ajustes › Privacidade e Segurança › Gravação de Tela | Miniaturas/preview em preto |
| **Rede Local** | Ajustes › Privacidade e Segurança › Rede Local | Alunos não abrem o endereço da sala |

O app agora detecta a concessão em tempo real e **se reinicia sozinho**, sem
intervenção manual.

#### Nome da rede (SSID) no macOS

O binário `airport` foi removido no macOS 14.4 e, do Sonoma em diante, o SSID só
é revelado a apps autorizados em **Serviços de Localização** — sem isso o sistema
devolve `<redacted>`. A detecção tenta `ipconfig getsummary` e depois
`networksetup -getairportnetwork`; quando nenhuma responde, exibe o nome
amigável da porta de hardware (**Wi-Fi**, **Ethernet**) em vez do device cru
(`en0`). A troca de rede continua sendo detectada em qualquer caso, porque o
monitor compara os IPs das interfaces, não o SSID.

---

## 📄 License

Developed by **Kellviny** • 2026
