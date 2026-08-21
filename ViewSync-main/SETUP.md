# 🚀 Guia de Setup — ViewSync

Passo a passo **prático** para rodar o projeto do zero no seu computador.

---

## 📋 Pré-requisitos

Instale **antes de começar**:

### macOS
```bash
# 1. Node.js (v18+) via Homebrew
brew install node

# 2. Xcode Command Line Tools (necessário para compilar mediasoup)
xcode-select --install

# 3. Verificar versões
node --version  # deve ser v18+
npm --version   # deve ser npm 9+
```

### Windows
```bash
# 1. Node.js (v18+) → baixe em https://nodejs.org/
# (selecione versão LTS)

# 2. Visual Studio Build Tools → baixe em:
# https://visualstudio.microsoft.com/downloads/
# Na instalação, marque: "Desktop development with C++"

# 3. Verificar versões
node --version
npm --version
```

### Linux (Ubuntu/Debian)
```bash
# 1. Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Build essentials
sudo apt-get install -y build-essential python3

# 3. Verificar
node --version
npm --version
```

---

## 1️⃣ Clonar ou abrir o projeto

```bash
# Se NÃO tem o projeto ainda
git clone <seu-repo-aqui>
cd ViewSync

# Se JÁ tem o projeto
cd ViewSync
```

---

## 2️⃣ Instalar dependências (IMPORTANTE)

```bash
# Instale em modo clean (limpa cache antigo)
npm ci

# Isso vai:
# - Instalar dependências da raiz
# - Instalar dependências de cada workspace (apps/*, packages/*)
# - Demorar ~2-3 minutos na primeira vez

# Se aparecer erro: "ERR! code ERESOLVE"
# → execute: npm install --legacy-peer-deps
```

---

## 3️⃣ Build do Frontend (Viewer Web)

```bash
# Construir a página web do viewer
npm run build --workspace=viewer-web

# Isso gera: apps/viewer-web/out/
# (arquivos estáticos HTML/CSS/JS)
```

---

## 4️⃣ Rebuild Nativo (Mediasoup) — ⚠️ IMPORTANTE

```bash
# Compilar mediasoup para seu SO
cd apps/desktop-transmissor
npm run rebuild:native

# Isso vai:
# - Compilar módulos nativos (C++)
# - Levar ~1-2 minutos
# - Criar node_modules/.bin/electron-rebuild

# Se falhar com erro de Python/Node-GYP:
# macOS: xcode-select --install
# Windows: Visual Studio Build Tools (ver pré-requisitos)
# Linux: sudo apt install python3 build-essential
```

---

## 5️⃣ Rodar em DEV MODE

### Terminal 1 — Servidor (signaling + mediasoup)
```bash
cd /seu/caminho/ViewSync/apps/desktop-transmissor

# Rodar servidor na porta 3001
npm run dev

# Você verá:
# ✓ Express server running on http://localhost:3001
# ✓ Socket.io ready
# ✓ Serving viewer web from: ../viewer-web/out
```

### Terminal 2 — Electron App
```bash
cd /seu/caminho/ViewSync/apps/desktop-transmissor

# Rodar o Electron (em outro terminal)
npm run dev

# Ou se preferir direto:
npx vite --open  # (abre no browser, modo debug Vite)
```

---

## ✅ Verificar se funcionou

1. **Electron abriu?** ✓ Sim → OK
2. **Servidor rodando?** ✓ Vá em `http://localhost:3001` no browser
3. **Ve "LanView" no topo?** ✓ Sim → PRONTO!

---

## 🐛 Troubleshooting

### Erro: "npm ERR! code ERESOLVE"
**Solução:**
```bash
npm install --legacy-peer-deps
```

### Erro: "Port 3001 already in use"
**Solução:**
```bash
# macOS/Linux
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Depois rode novamente: npm run dev
```

### Erro: "mediasoup not found" ou "ERESOLVE peer dependencies"
**Solução:**
```bash
cd apps/desktop-transmissor
rm -rf node_modules package-lock.json
npm install
npm run rebuild:native
```

### Erro: "Cannot find module 'electron'" no Vite
**Solução:**
```bash
npm run typecheck  # valida tipo de dados
npm run build      # testa build production
```

### Erro na compilação (Windows): "Visual Studio build tools not found"
**Solução:**
- Baixe: https://visualstudio.microsoft.com/downloads/
- Rode o instalador
- Marque: "Desktop development with C++"
- Reinicie o terminal

### Electron não abre ou fica branco
**Solução:**
```bash
# Terminal 1: Verifique se servidor está rodando
npm run dev

# Terminal 2: Debugar Electron
npm run dev --verbose

# Se continuar: limpar cache
rm -rf node_modules .next dist-electron
npm install
npm run rebuild:native
```

---

## 📦 Comandos úteis

```bash
# Validar TypeScript (sem erros?)
npm run typecheck --workspace=view-sync-desktop

# Build completo (produção)
npm run build --workspace=view-sync-desktop

# Limpar tudo e reinstalar
npm run clean  # (se existir)
rm -rf node_modules
npm install

# Ver workspace atual
npm run -a list

# Rodar só o servidor (sem Electron)
npm run dev --workspace=view-sync-desktop
```

---

## 🎯 Próximos passos

1. ✅ Projeto rodando localmente?
2. → Teste captura de tela (botão "Start Stream")
3. → Abra viewer web em `http://localhost:3001`
4. → Conecte visualizador

---

## 📞 Dúvidas?

Se der erro:
1. Copie a mensagem de erro completa
2. Rode: `npm list mediasoup` (veja se instalou)
3. Rode: `npm run typecheck` (erro de TypeScript?)
4. Verifique se Node.js é v18+: `node --version`

**Sucesso! 🚀**
