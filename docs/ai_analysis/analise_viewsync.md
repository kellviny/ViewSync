# ViewSync — Análise Técnica Completa

---

## 1. 💾 Persistência de Login (localStorage)

### Status atual: ❌ NÃO implementado

O código em [`useViewerController.ts`](file:///c:/Users/Kellviny/Documents/GitHub/ViewSync-branch/ViewSync-main/apps/viewer-web/src/presentation/hooks/useViewerController.ts) inicializa os campos em branco:

```ts
const [viewerName, setViewerName] = useState('')
const [viewerEnrollment, setViewerEnrollment] = useState('')
```

Não há nenhuma leitura de `localStorage` ao montar o componente, nem escrita após submissão da identidade.

### Nível de dificuldade: 🟢 Fácil (15–30 min)

### O que precisa ser feito

Adicionar 3 modificações em [`useViewerController.ts`](file:///c:/Users/Kellviny/Documents/GitHub/ViewSync-branch/ViewSync-main/apps/viewer-web/src/presentation/hooks/useViewerController.ts):

**a) Ler do localStorage na inicialização:**
```ts
const [viewerName, setViewerName] = useState(() =>
  localStorage.getItem('vs_viewer_name') ?? ''
)
const [viewerEnrollment, setViewerEnrollment] = useState(() =>
  localStorage.getItem('vs_viewer_enrollment') ?? ''
)
```

**b) Salvar após validação bem-sucedida (`submitViewerIdentity`):**
```ts
localStorage.setItem('vs_viewer_enrollment', normalizedEnrollment)
localStorage.setItem('vs_viewer_name', normalizedName)
```

**c) Pré-preencher automaticamente:** Se `localStorage` tiver ambos os campos, chamar `setHasViewerIdentity(true)` diretamente após o mount — eliminando o modal para usuários que já se identificaram antes.

> [!NOTE]
> O `localStorage` é por domínio/porta, então funciona perfeitamente neste cenário onde o app web roda em `http://IP:3000`.

---

## 2. ⏱️ Rastreamento de Tempo de Visualização por Usuário

### Status atual: ❌ NÃO implementado

O [`RoomSessionState.ts`](file:///c:/Users/Kellviny/Documents/GitHub/ViewSync-branch/ViewSync-main/apps/desktop-transmissor/electron/signaling/RoomSessionState.ts) já rastreia quem é `isViewing` (ativo ou não), mas **não registra timestamps** de entrada/saída. O [`server.ts`](file:///c:/Users/Kellviny/Documents/GitHub/ViewSync-branch/ViewSync-main/apps/desktop-transmissor/electron/server.ts) faz log no console mas não armazena duração.

### Nível de dificuldade: 🟡 Médio (2–4 horas)

### O que precisa ser implementado

#### No servidor (`RoomSessionState.ts` + `server.ts`)

1. **Adicionar campos de tempo por viewer:**
```ts
private viewerWatchTime = new Map<string, number>()   // acumulado em ms
private viewerWatchStart = new Map<string, number>()  // timestamp de início da janela atual
```

2. **Ao ligar/desligar visibilidade** (`setViewerVisibility`):
```ts
public setViewerVisibility(socketId: string, isVisible: boolean): void {
  if (isVisible) {
    this.viewerWatchStart.set(socketId, Date.now())
    this.activeViewers.add(socketId)
  } else {
    const start = this.viewerWatchStart.get(socketId)
    if (start) {
      const elapsed = this.viewerWatchTime.get(socketId) ?? 0
      this.viewerWatchTime.set(socketId, elapsed + (Date.now() - start))
      this.viewerWatchStart.delete(socketId)
    }
    this.activeViewers.delete(socketId)
  }
}
```

3. **Ao encerrar a transmissão** (`onHostStopStream`): gerar e emitir o relatório antes de resetar o estado.

4. **Novo evento Socket.IO** `host:watch_report` emitido ao host com o relatório completo.

#### No frontend do transmissor (`StreamingPanel.tsx`)

Criar um **modal de relatório final** exibido quando a transmissão é encerrada, mostrando:

| Campo | Detalhe |
|---|---|
| Nome + Matrícula | Identificação do viewer |
| Tempo total | Em minutos e segundos |
| Status | Quem mais / quem menos assistiu |
| Ranking | Ordem do menor ao maior tempo |

O modal também exibe: **Tempo médio geral** e **destaque** de quem assistiu mais e menos.

#### Estrutura do relatório gerado:
```ts
type WatchReport = {
  viewers: {
    name: string
    enrollment: string
    watchTimeMs: number
    watchTimeFormatted: string // "12m 34s"
  }[]
  averageMs: number
  minViewer: { name: string; enrollment: string }
  maxViewer: { name: string; enrollment: string }
}
```

---

## 3. 🖥️ Captura de Tela no Mac — Diagnóstico do Bug

### Por que acontecia

O [`ipcHandlers.ts`](file:///c:/Users/Kellviny/Documents/GitHub/ViewSync-branch/ViewSync-main/apps/desktop-transmissor/electron/main/ipcHandlers.ts) usa `desktopCapturer.getSources`:

```ts
const sources = await desktopCapturer.getSources({
  types: ['window', 'screen'],
  fetchWindowIcons: true,
})
```

**Esse código está correto** — `types: ['window', 'screen']` retorna tanto janelas quanto telas. O problema no Mac **não era** o código do `getSources`, mas sim **permissões do macOS**:

### Causa raiz (macOS)

1. **Permissão de Screen Recording** (`NSScreenCaptureUsageDescription`): No macOS Catalina+, o app precisa da permissão explícita de "Screen Recording" nas Preferências do Sistema. Sem ela, `getSources` retorna fontes, mas as **thumbnails aparecem em preto** e a captura real falha silenciosamente.

2. **Hardened Runtime + Sandbox**: O `package.json` já tem `"hardenedRuntime": true`. Se o entitlement `com.apple.security.cs.allow-unsigned-executable-memory` não estiver declarado, o mediasoup worker falha.

3. **Electron 30 no macOS 14+**: Versões antigas do Electron tinham um bug onde `getSources` com `types: ['screen']` retornava **apenas a tela principal** (index 0) em sistemas multi-monitor quando rodando sem o entitlement correto de Screen Recording.

### Status atual

O `package.json` já configura:
```json
"extendInfo": {
  "NSScreenCaptureUsageDescription": "Este app precisa acessar a captura de tela..."
}
```

Mas os arquivos `build/entitlements.mac.plist` e `build/entitlements.mas.plist` **precisam existir** no repositório. Se não existirem, a build falha ou não aplica as permissões corretamente.

> [!WARNING]
> Verificar se os arquivos `build/entitlements.mac.plist` e `build/entitlements.mas.plist` existem no projeto. Se não existirem, o bug de captura de tela **ainda não está corrigido** para builds de produção.

**Entitlement mínimo necessário (`entitlements.mac.plist`):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
  <key>com.apple.security.device.camera</key><true/>
  <key>com.apple.security.device.microphone</key><true/>
</dict>
</plist>
```

---

## 4. 🍎 Publicação na Apple App Store — Passo a Passo

> [!IMPORTANT]
> O app usa **mediasoup** (código nativo compilado em C++) e abre servidor TCP/UDP local. Isso é **incompatível com o Mac App Store Sandbox**. A publicação viável é como **app direto** (fora da MAS) com notarização, ou via MAS com restrições severas de funcionalidade.

### Opção A — Distribuição Direta com Notarização (recomendada para esse app)

**Pré-requisitos:**
- Conta Apple Developer: **USD 99/ano** em [developer.apple.com](https://developer.apple.com)
- Mac com Xcode instalado
- Certificado de **Developer ID Application**

**Passo a passo:**

1. **Criar conta Apple Developer** → [developer.apple.com/programs](https://developer.apple.com/programs)

2. **Gerar certificados** no Xcode → Preferences → Accounts → Manage Certificates:
   - `Developer ID Application: Seu Nome`
   - `Developer ID Installer: Seu Nome`

3. **Verificar os entitlements** — criar `build/entitlements.mac.plist` (ver seção 3)

4. **Build do app:**
```bash
cd apps/desktop-transmissor
npm run build:mac
```
Gera um `.dmg` em `release/`

5. **Notarizar com `notarytool`:**
```bash
xcrun notarytool submit release/LanView-1.0.4.dmg \
  --apple-id "seu@email.com" \
  --team-id "TEAM_ID" \
  --password "app-specific-password" \
  --wait
```

6. **Stapling** (gravar o ticket de notarização no arquivo):
```bash
xcrun stapler staple "release/LanView-1.0.4.dmg"
```

7. **Distribuir**: o `.dmg` notarizado pode ser distribuído pelo seu site.

---

### Opção B — Mac App Store (MAS) — com limitações

O `package.json` já tem configuração `"mas"`, o que indica intenção de publicar na MAS.

**Problema crítico**: mediasoup usa sockets UDP e abre portas arbitrárias. A MAS Sandbox proíbe isso. **Seria necessário remover o mediasoup e usar WebRTC nativo via servidor externo**, o que é uma reescrita significativa.

**Estrutura de arquivos necessária para MAS:**

```
apps/desktop-transmissor/
├── build/
│   ├── entitlements.mas.plist         ← criar
│   ├── entitlements.mas.inherit.plist ← criar
│   └── icon.icns                      ← verificar se existe
└── public/
    └── ico.icns                       ← já referenciado no package.json
```

**Passo a passo MAS:**
1. Criar App ID em [developer.apple.com/account](https://developer.apple.com/account)
2. Criar App no [App Store Connect](https://appstoreconnect.apple.com)
3. Gerar certificados: `Mac App Distribution` + `Mac Installer Distribution`
4. Build: `npm run build` (usa target `mas`)
5. Upload via Xcode → Organizer ou `altool`
6. Preencher metadata no App Store Connect
7. Submeter para revisão (1–7 dias)

---

## 5. 🪟 Publicação na Microsoft Store

### Requisitos

| Item | Detalhe |
|---|---|
| Conta | [Microsoft Partner Center](https://partner.microsoft.com) — taxa única de **USD 19** para indivíduos |
| Formato | **MSIX** (substitui o antigo AppX) |
| Arquitetura | x64 e/ou arm64 |
| Assinatura | Certificado de code signing (obrigatório) |

### Passo a passo

1. **Criar conta** em [partner.microsoft.com/dashboard](https://partner.microsoft.com/dashboard)

2. **Build MSIX com electron-builder:**
O `package.json` atual só tem `"win": { "target": ["nsis", "portable"] }`. Adicionar:
```json
"win": {
  "target": ["nsis", "portable", "appx"],
  "icon": "public/ico.ico"
},
"appx": {
  "applicationId": "ViewSyncStudio",
  "backgroundColor": "#0a0a0f",
  "displayName": "ViewSync Studio",
  "identityName": "SeuNome.ViewSyncStudio",
  "publisher": "CN=SeuNome",
  "publisherDisplayName": "Kellviny",
  "languages": ["pt-BR"]
}
```

3. **Build:**
```bash
cd apps/desktop-transmissor
npm run build:win
```

4. **Assinar o MSIX** com certificado (pode ser autoassinado para teste):
```bash
signtool sign /fd SHA256 /a release/LanView.appx
```

5. **Upload no Partner Center** → Apps e jogos → Criar novo app → Enviar pacote

6. **Preencher ficha**: screenshots (mín. 1280×800), ícones, descrição PT-BR/EN

7. **Submeter** — revisão leva em média 1–3 dias úteis

> [!NOTE]
> O electron-builder gera `.appx` nativamente. A Microsoft Store aceita MSIX e AppX. Para apps com mediasoup (código nativo), marcar o app como "desktop bridge" no Partner Center.

---

## 6. 🌐 Versão para Usuários Comuns (Não Acadêmicos)

### Avaliação

O campo de **matrícula** é exclusivamente acadêmico (padrão `AAAA999LLLL9999`). Para uma versão pública/comercial, ele **não faz sentido** e deve ser removido ou substituído.

### Proposta de arquitetura

**Versão Acadêmica (Mac)** — mantém como está:
- Campo de matrícula obrigatório
- Campo de nome completo
- Validação de padrão acadêmico
- Distribuição via `.dmg` notarizado para professores

**Versão Pública (Web/Desktop)** — nova versão:
- Substituir matrícula por **e-mail** ou **apelido/nickname** (mais amigável)
- Manter campo de nome
- Autenticação **opcional por senha** (já existe no sistema)
- Sem vínculo institucional

### Implementação sugerida

Criar uma flag de build ou variável de ambiente:
```ts
// env: VITE_APP_MODE = 'academic' | 'public'
const IS_ACADEMIC = import.meta.env.VITE_APP_MODE === 'academic'
```

No `ViewerIdentityModal.tsx`, renderizar campos condicionalmente:
- Modo `academic`: Matrícula + Nome (atual)
- Modo `public`: E-mail (ou Apelido) + Nome

No `server.ts`, validar conforme o modo:
- Modo `academic`: valida padrão de matrícula
- Modo `public`: valida e-mail ou apenas comprimento mínimo do apelido

### Sobre pagamento ao desenvolvedor ("mandar dinheiro")

Você perguntou sobre isso. As principais opções para monetização do app:

| Método | Plataforma | Taxa | Como funciona |
|---|---|---|---|
| **PIX** | Manual | 0% | Link de doação na tela de créditos |
| **Ko-fi / Buy Me a Coffee** | Web | 0–5% | Botão "Apoiar" dentro do app |
| **In-App Purchase** | Mac App Store | 30% | Requer configuração no App Store Connect |
| **Stripe / Paddle** | Qualquer | 2–5% | Venda de licença antes do download |
| **GitHub Sponsors** | GitHub | 0% | Para projetos open-source |

> [!TIP]
> A forma mais simples: adicionar um link **Ko-fi** ou **PIX** na tela de créditos do footer do transmissor. Já tem um `© 2026 ViewSync Studio • by Kellviny` no rodapé — adicionar um botão "☕ Apoiar" logo ao lado.

---

## Resumo Executivo

| Ponto | Status Atual | Dificuldade | Prioridade |
|---|---|---|---|
| 1. Persistência de login | ❌ Não implementado | 🟢 Fácil | Alta |
| 2. Rastreamento de tempo | ❌ Não implementado | 🟡 Médio | Alta |
| 3. Bug captura tela Mac | ⚠️ Parcialmente corrigido* | 🟡 Médio | Alta |
| 4. Apple App Store | ⚠️ Estrutura parcial | 🔴 Difícil | Média |
| 5. Microsoft Store | ❌ Não configurado | 🟡 Médio | Baixa |
| 6. Versão pública | ❌ Não implementado | 🟡 Médio | Média |

*O código de captura está correto, mas os arquivos de entitlements podem não existir.
