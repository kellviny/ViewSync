# 🚀 Guia de Setup e Build — ViewSync (LanView)

Passo a passo completo e prático para configurar o ambiente de desenvolvimento e **gerar os executáveis/instaladores (Build)** no seu computador em qualquer sistema operacional (**Windows**, **macOS** ou **Linux**).

---

## 📋 1. Pré-requisitos por Sistema Operacional

Instale as dependências essenciais de acordo com a sua máquina antes de começar:

### 🪟 Windows
1. **Node.js (v18+)**: Baixe a versão LTS em [nodejs.org](https://nodejs.org/).
2. **Visual Studio Build Tools (C++)**: Necessário para compilar o módulo nativo do *Mediasoup*.
   - Baixe o instalador em: [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/) (procure por *Build Tools para Visual Studio*).
   - Durante a instalação, marque a opção: **"Desenvolvimento para desktop com C++"** (*Desktop development with C++*).
3. **Python (3.x)**: Geralmente instalado automaticamente junto com as Build Tools do VS.

### 🍎 macOS (Apple Silicon M1/M2/M3/M4 ou Intel)
1. **Node.js (v18+)**: Via Homebrew (`brew install node`) ou pelo site oficial.
2. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **Python 3**: Padrão do macOS ou via `brew install python`.

### 🐧 Linux (Ubuntu / Debian / Pop!_OS)
1. **Node.js (v18+)**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. **Ferramentas de compilação C++ e Python**:
   ```bash
   sudo apt-get install -y build-essential python3 python3-pip
   ```

---

## 📥 2. Clonando o Repositório e Instalando Dependências

Abra o terminal na pasta do projeto e instale todas as dependências do monorepo:

```bash
# 1. Clonar o projeto (se ainda não tiver clonado)
git clone https://github.com/kellviny/ViewSync.git
cd ViewSync

# 2. Instalar dependências de todos os workspaces (raiz, desktop e viewer-web)
npm ci
```
> 💡 *Caso ocorra algum conflito de dependências antigas, use:* `npm install --legacy-peer-deps`

---

## ⚙️ 3. Compilação dos Módulos Nativos (Mediasoup SFU)

O **Mediasoup** requer um executável *worker* compilado em C++ para a arquitetura exata do seu processador e versão do Electron:

```bash
# Entrar na pasta do desktop e compilar para o Electron da sua máquina
cd apps/desktop-transmissor
npm run rebuild:native
cd ../..
```
*Esse processo leva cerca de 1 a 2 minutos e compilará o binário nativo com sucesso.*

---

## 💻 4. Rodando em Modo de Desenvolvimento (Dev)

Você pode rodar toda a aplicação com um único comando na raiz do projeto:

```bash
# Modo Padrão (LanView)
npm run dev:normal

# Modo Institucional (Customizado para instituições de ensino)
npm run dev:inst
```

*O comando iniciará o servidor de desenvolvimento Vite, compilará o Electron e abrirá a janela do **ViewSync Studio** automaticamente.*

---

## 📦 5. Como Gerar o Build (Executáveis e Instaladores)

Os comandos abaixo realizam o fluxo completo:
1. Compila e gera o export estático do **Viewer Web** (`apps/viewer-web/out`).
2. Compila os arquivos TypeScript e empacota os arquivos do **Transmissor Electron**.
3. Gera os instaladores finais dentro da pasta **`apps/desktop-transmissor/release/`**.

---

### 🪟 Build no Windows

Execute na **raiz do projeto**:

```bash
# Gera o Instalador NSIS (.exe) E o Executável Portátil (.exe) - Modo Normal
npm run build:normal:win

# Modo Institucional
npm run build:inst:win
```

📁 **Arquivos gerados em `apps/desktop-transmissor/release/`:**
* **`LanView-Setup-1.1.3-win-x64.exe`**: Instalador clássico do Windows com atalhos na Área de Trabalho e Menu Iniciar.
* **`LanView-Portable-1.1.3-win-x64.exe`**: Versão portátil autossuficiente (basta dar dois cliques para rodar, não precisa instalar).
* **`win-unpacked/LanView.exe`**: Versão descompactada para testes imediatos.

---

### 🍎 Build no macOS

Execute na **raiz do projeto** em uma máquina Mac:

```bash
# Para Macs com Apple Silicon (M1, M2, M3, M4 - ARM64)
npm run build:normal:mac:arm64
# ou modo institucional:
npm run build:inst:mac:arm64

# Para Macs com processador Intel (x64)
npm run build:normal:mac
# ou modo institucional:
npm run build:inst:mac
```

📁 **Arquivos gerados em `apps/desktop-transmissor/release/`:**
* **`LanView-1.1.3-mac-arm64.dmg`** (ou `.dmg` para x64): Imagem de disco padrão do macOS com suporte a arrastar para a pasta *Applications*.

---

### 🐧 Build no Linux

Execute na **raiz do projeto** em uma distribuição Linux:

```bash
npm run build:linux
```

📁 **Arquivos gerados em `apps/desktop-transmissor/release/`:**
* **`LanView-1.1.3-x86_64.AppImage`**: Executável universal compatível com qualquer distribuição Linux.
* **`lanview_1.1.3_amd64.deb`**: Pacote de instalação para Debian, Ubuntu, Linux Mint, etc.

---

## 🛠️ 6. Resolução de Problemas (Troubleshooting)

### ❌ Erro: "Visual Studio C++ build tools not found" (Windows)
* **Causa:** O compilador C++ da Microsoft não foi instalado.
* **Solução:** Baixe o *Build Tools para Visual Studio*, execute o instalador e certifique-se de marcar **"Desenvolvimento para desktop com C++"**.

### ❌ Erro: "Mediasoup worker failed to exit / ABI mismatch"
* **Causa:** O worker nativo foi compilado para outra versão do Node/Electron ou foi corrompido.
* **Solução:**
  ```bash
  cd apps/desktop-transmissor
  npm run clean:native
  cd ../..
  ```

### ❌ Porta 3001 ocupada ("Port 3001 already in use")
* **Solução Windows:**
  ```powershell
  Get-Process | Where-Object { $_.ProcessName -like "*electron*" -or $_.ProcessName -like "*node*" } | Stop-Process -Force
  ```
* **Solução macOS / Linux:**
  ```bash
  lsof -ti:3001 | xargs kill -9
  ```

---

## 🎯 Resumo dos Comandos Úteis

| Comando | Descrição |
|---|---|
| `npm run dev:normal` | Inicia o app desktop e servidor em modo de desenvolvimento |
| `npm run dev:inst` | Inicia em modo de desenvolvimento com tema institucional |
| `npm run build:normal:win` | Gera os executáveis para Windows (`Setup.exe` e `Portable.exe`) |
| `npm run build:normal:mac:arm64` | Gera o `.dmg` para macOS Apple Silicon |
| `npm run build:normal:mac` | Gera o `.dmg` para macOS Intel |
| `npm run build:linux` | Gera `.AppImage` e `.deb` para Linux |
| `npm run typecheck --workspace=view-sync-desktop` | Valida todos os tipos TypeScript |

---

Desenvolvido por **Kellviny** • 2026

