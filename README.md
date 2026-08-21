# ViewSync 🖥️🚀

ViewSync is a professional screen sharing system designed for educational environments. It uses **SFU (Selective Forwarding Unit)** architecture with **Mediasoup** to provide ultra-low latency streaming within a local network (LAN), allowing a teacher to broadcast their screen to multiple students simultaneously with high performance.

## 🌟 Key Features

- **Ultra-Low Latency**: Real-time streaming using WebRtc.
- **Privacy & Security**: Secure rooms with optional password protection.
- **Responsive Design**: Modern, glassmorphic UI that works on any device.
- **Smart Bandwidth Management**: Automatic pause/resume based on tab visibility.
- **Cross-Platform**: Native applications for Windows and macOS.

## 🛠️ Technology Stack

- **Core**: Node.js, TypeScript.
- **Streaming**: Mediasoup (SFU), Socket.io, WebRtc.
- **Frontend**: React, Next.js, Tailwind CSS, Lucide Icons.
- **Desktop**: Electron, Vite.

## 🏗️ Architecture

ViewSync uses a distributed architecture:
1. **Transmissor (Host)**: An Electron app that captures the screen and sends it to the server.
2. **SFU Server**: Manages WebRtc transports and forwards media streams.
3. **Viewer (Client)**: A web-based application where students can view the broadcast.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- C++ Build Tools (for Mediasoup)
- See [SETUP.md](SETUP.md) for detailed step-by-step instructions for your OS

### Quick Start
```bash
# Install dependencies
npm ci

# Build the viewer web app
npm run build --workspace=viewer-web

# Go to desktop app and rebuild native modules
cd apps/desktop-transmissor
npm run rebuild:native

# Run dev mode (from root)
npm start:desktop
```

**For complete setup guide:** See [SETUP.md](SETUP.md)

## 📦 Distribution

Executables for Windows and macOS are automatically generated via GitHub Actions:
- **Windows**: `.exe` (Installer & Portable)
- **macOS**: `.dmg` (Universal)

---
Developed by **Kellviny** &bull; 2026
