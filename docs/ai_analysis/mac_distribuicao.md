# ViewSync Studio — Por que não posso subir para a Mac App Store agora?

> Você já tem a licença Apple Developer (USD 99/ano). Esse documento explica o que mais está faltando, o que bloqueia tecnicamente, e o caminho real para distribuir o app no Mac.

---

## 🔴 O bloqueio principal: App Sandbox vs. Mediasoup

A **Mac App Store (MAS)** exige obrigatoriamente que todos os apps rodem dentro do **App Sandbox** da Apple. O Sandbox é um sistema de isolamento que restringe o que o processo pode fazer.

O ViewSync Studio usa o **Mediasoup** como motor de WebRTC. Mediasoup:

1. **Compila um worker nativo em C++** que é executado como processo filho separado
2. **Abre sockets UDP em portas arbitrárias** (no seu caso: 40000–41000) para o tráfego de vídeo WebRTC
3. **Inicia um servidor HTTP na porta 3000** para sinalização Socket.IO

O App Sandbox da Apple **proíbe exatamente isso**:

| O que o App Sandbox bloqueia | Por que o Mediasoup precisa disso |
|---|---|
| Executar binários não-assinados como processo filho | Worker do mediasoup é um binário C++ compilado localmente |
| Abrir portas de servidor arbitrárias | Mediasoup precisa de UDP 40000–41000 para WebRTC |
| Usar `com.apple.security.network.server` com UDP livre | A Apple limita severamente o uso de sockets UDP no sandbox |
| Carregar bibliotecas dinâmicas sem validação | mediasoup usa `dlopen` para carregar módulos nativos |

**Resultado:** Se você tentar subir para a MAS agora, o mediasoup worker vai falhar ao iniciar dentro do sandbox, e o app simplesmente não vai funcionar após aprovação — o que levaria à rejeição da Apple ou ao app quebrado.

---

## ✅ O que já está pronto no projeto

| Item | Status |
|---|---|
| Licença Apple Developer (USD 99/ano) | ✅ Você já tem |
| Ícone `.icns` para Mac | ✅ `public/ico.icns` existe |
| Configuração `"mac"` no `package.json` | ✅ Configurado |
| Configuração `"mas"` no `package.json` | ✅ Configurado |
| `NSScreenCaptureUsageDescription` | ✅ Declarado via `extendInfo` |
| `build/entitlements.mac.plist` | ✅ Criado agora |
| `build/entitlements.mas.plist` | ✅ Criado agora |
| `build/entitlements.mas.inherit.plist` | ✅ Criado agora |
| Código correto de `desktopCapturer` | ✅ `types: ['window', 'screen']` |

---

## 🛣️ O que falta — e o caminho viável

Como a MAS está bloqueada pelo mediasoup, **a distribuição correta para o seu caso é a Distribuição Direta com Notarização** — que funciona igual a qualquer outro app Mac, é totalmente legal, e não precisa do App Sandbox.

> Exemplos de apps famosos que usam distribuição direta (sem MAS): VS Code, Figma, Notion, Zoom, Discord.

---

## Passo a passo completo — Distribuição Direta com Notarização

### PRÉ-REQUISITOS
- ✅ Licença Apple Developer ativa (você já tem)
- ❌ **Mac físico** (macOS 12+) — não tem como notarizar no Windows
- ❌ **Xcode instalado** no Mac (gratuito, ~12 GB)
- ❌ **Certificado de Developer ID** gerado

---

### PASSO 1 — Gerar o certificado de Developer ID (no Mac)

1. Abra o **Xcode** no Mac
2. Vá em **Xcode → Settings → Accounts**
3. Selecione seu Apple ID → clique em **Manage Certificates**
4. Clique em **+** e escolha **Developer ID Application**
5. O certificado é instalado automaticamente no Keychain

> **Importante:** O certificado `Developer ID Application` é diferente do certificado usado para a MAS. Ele permite distribuição fora da Store.

---

### PASSO 2 — Configurar senha de app específica (para notarytool)

1. Acesse [appleid.apple.com](https://appleid.apple.com)
2. Vá em **Sign-In and Security → App-Specific Passwords**
3. Clique em **+** e crie uma senha com nome `viewsync-notarize`
4. Anote essa senha — ela será usada só uma vez no terminal

---

### PASSO 3 — Descobrir seu Team ID

1. Acesse [developer.apple.com/account](https://developer.apple.com/account)
2. No canto superior direito, seu **Team ID** aparece (ex: `A1B2C3D4E5`)
3. Anote esse código

---

### PASSO 4 — Clonar o repositório no Mac e instalar dependências

```bash
# No Mac, abrir o Terminal
git clone https://github.com/seu-usuario/ViewSync.git
cd ViewSync/apps/desktop-transmissor
npm install

# Recompilar o mediasoup para o ABI do Electron no Mac
npm run rebuild:native
```

> ⚠️ O `rebuild:native` pode levar 5–15 minutos na primeira vez. Requer Xcode Command Line Tools (`xcode-select --install`).

---

### PASSO 5 — Build do app no Mac

```bash
# Dentro de apps/desktop-transmissor
npm run build:mac
```

Esse comando:
1. Compila o viewer-web (`cd ../viewer-web && npm run build`)
2. Compila o TypeScript do Electron
3. Empacota tudo com o `electron-builder --mac`
4. Gera o arquivo `.dmg` em `release/`

---

### PASSO 6 — Notarizar o .dmg

```bash
xcrun notarytool submit "release/LanView-1.0.4.dmg" \
  --apple-id "seu@email.com" \
  --team-id "SEU_TEAM_ID" \
  --password "xxxx-xxxx-xxxx-xxxx" \
  --wait
```

- `--apple-id`: seu Apple ID (email da conta de desenvolvedor)
- `--team-id`: o código do Passo 3
- `--password`: a app-specific password do Passo 2
- `--wait`: aguarda a notarização terminar (leva 2–10 minutos)

**Saída esperada:**
```
Successfully uploaded file
  id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  path: release/LanView-1.0.4.dmg

Waiting for processing to complete.
Current status: Accepted
Processing complete
  id: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  status: Accepted
```

Se aparecer `status: Invalid`, rodar:
```bash
xcrun notarytool log <submission-id> --apple-id "..." --team-id "..." --password "..."
```
Para ver o motivo da rejeição.

---

### PASSO 7 — Staple (gravar o ticket no arquivo)

```bash
xcrun stapler staple "release/LanView-1.0.4.dmg"
```

Isso grava o ticket de notarização **dentro do .dmg**. Após isso, o Gatekeeper do macOS aceita o app mesmo sem conexão com a internet.

---

### PASSO 8 — Verificar que está tudo certo

```bash
spctl --assess --type open --context context:primary-signature -v "release/LanView-1.0.4.dmg"
```

**Saída esperada:**
```
release/LanView-1.0.4.dmg: accepted
source=Notarized Developer ID
```

---

### PASSO 9 — Distribuir

O `.dmg` notarizado pode ser distribuído:
- Pelo seu **site/GitHub Releases**
- Por **e-mail direto** para professores
- Por qualquer link de download

Usuários que baixarem verão o app abrir normalmente, sem o aviso "não pode ser aberto" do Gatekeeper.

---

## Por que a MAS exigiria uma reescrita?

Para publicar na MAS no futuro, a arquitetura precisaria mudar:

| Mudança necessária | Esforço |
|---|---|
| Remover mediasoup do app | 🔴 Grande — é o coração do WebRTC |
| Usar um servidor externo (Twilio/Agora/Janus na nuvem) | 🔴 Grande + custos mensais |
| Ou usar WebRTC nativo via `RTCPeerConnection` com servidor STUN/TURN na nuvem | 🔴 Grande + hospedagem |
| O app deixaria de ser 100% local (LAN) | 🟡 Mudança de conceito |

**Resumo:** A MAS não é adequada para este app na arquitetura atual. A distribuição direta com notarização é a solução certa.

---

## Resumo visual do que você precisa agora

```
Você já tem:          O que falta:
✅ Licença USD 99     ❌ Mac físico (macOS 12+)
✅ Entitlements       ❌ Certificado Developer ID (gerar no Xcode)
✅ package.json Mac   ❌ App-specific password (apleid.apple.com)
✅ Ícone .icns        ❌ Rodar npm run build:mac no Mac
✅ Código correto     ❌ Rodar xcrun notarytool
                      ❌ Rodar xcrun stapler staple
```

**Custo extra:** R$ 0 (tudo incluso na licença de USD 99/ano que você já tem).  
**Tempo estimado:** 1–2 horas na primeira vez, incluindo compilação do mediasoup.

---

*Documento gerado em 25/05/2026 · ViewSync Studio v1.0.4*
