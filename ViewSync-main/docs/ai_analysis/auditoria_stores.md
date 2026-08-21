# ViewSync — Auditoria de Estrutura para App Stores

---

## ❌ Resumo: A estrutura atual NÃO está pronta para nenhuma das stores

---

## 🍎 Apple (Mac App Store / Distribuição Direta)

### Arquivos PRESENTES ✅
| Arquivo | Status | Obs |
|---|---|---|
| `public/ico.icns` | ✅ Existe | Ícone Mac — OK |
| `package.json` → `"mac"` config | ✅ Existe | Configuração de build Mac |
| `package.json` → `"mas"` config | ✅ Existe | Configuração Mac App Store |
| `NSScreenCaptureUsageDescription` | ✅ No `package.json` | Declarado via `extendInfo` |

### Arquivos FALTANDO ❌
| Arquivo | Obrigatório para | Crítico? |
|---|---|---|
| `build/entitlements.mac.plist` | Build macOS + Notarização | 🔴 SIM |
| `build/entitlements.mas.plist` | Mac App Store | 🔴 SIM |
| `build/entitlements.mas.inherit.plist` | Mac App Store | 🔴 SIM |
| `build/icon.icns` (pasta build/) | electron-builder prefere aqui | 🟡 Médio |
| `Info.plist` customizado | MAS com permissões extras | 🟡 Médio |

> [!CAUTION]
> O README menciona `build/entitlements.mac.plist` na linha 244, mas **essa pasta não existe no repositório**. O `package.json` também aponta para ela em `"entitlements": "build/entitlements.mac.plist"`. Sem esse arquivo, o `electron-builder --mac` **falha ou cria um build não-notarizável**.

### O que criar: `build/entitlements.mac.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
  <key>com.apple.security.device.camera</key><true/>
  <key>com.apple.security.device.microphone</key><true/>
  <key>com.apple.security.network.server</key><true/>
  <key>com.apple.security.network.client</key><true/>
</dict>
</plist>
```

### O que criar: `build/entitlements.mas.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key><true/>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.network.server</key><true/>
  <key>com.apple.security.network.client</key><true/>
  <key>com.apple.security.device.camera</key><true/>
  <key>com.apple.security.device.microphone</key><true/>
</dict>
</plist>
```

### O que criar: `build/entitlements.mas.inherit.plist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.app-sandbox</key><true/>
  <key>com.apple.security.inherit</key><true/>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
</dict>
</plist>
```

---

## 🪟 Microsoft Store (MSIX / AppX)

### Arquivos PRESENTES ✅
| Arquivo | Status |
|---|---|
| `public/ico.ico` | ✅ Ícone Windows — OK |
| `package.json` → `"win"` config | ✅ Existe (`nsis`, `portable`) |

### Arquivos/Config FALTANDO ❌
| O que falta | Crítico? |
|---|---|
| Target `"appx"` no `package.json` → `"win"` | 🔴 SIM — sem isso não gera MSIX |
| Bloco `"appx": { ... }` no `package.json` | 🔴 SIM |
| Ícones em múltiplos tamanhos para MSIX | 🟡 Médio |
| `public/StoreLogo.png` (50×50) | 🟡 Obrigatório pela Store |
| `public/Square150x150Logo.png` | 🟡 Obrigatório |
| `public/Square44x44Logo.png` | 🟡 Obrigatório |

### O que adicionar no `package.json`:
```json
"win": {
  "target": ["nsis", "portable", "appx"],
  "icon": "public/ico.ico"
},
"appx": {
  "applicationId": "ViewSyncStudio",
  "backgroundColor": "#0a0a0f",
  "displayName": "ViewSync Studio",
  "identityName": "Kellviny.ViewSyncStudio",
  "publisher": "CN=Kellviny",
  "publisherDisplayName": "Kellviny",
  "languages": ["pt-BR", "en-US"],
  "addAutoLaunchExtension": false
}
```

---

## 📁 Estrutura ideal após as correções

```
apps/desktop-transmissor/
│
├── build/                              ← CRIAR esta pasta
│   ├── entitlements.mac.plist          ← CRIAR (obrigatório Apple)
│   ├── entitlements.mas.plist          ← CRIAR (obrigatório MAS)
│   └── entitlements.mas.inherit.plist  ← CRIAR (obrigatório MAS)
│
├── public/
│   ├── ico.ico           ✅ existe
│   ├── ico.icns          ✅ existe
│   ├── StoreLogo.png     ← CRIAR (Microsoft Store 50×50)
│   ├── Square44x44Logo.png   ← CRIAR
│   └── Square150x150Logo.png ← CRIAR
│
├── electron/             ✅ OK
├── src/                  ✅ OK
├── package.json          ⚠️ adicionar bloco "appx"
└── ...
```

---

## Checklist de preparação

### Para distribuição Mac direta (notarização)
- [ ] Criar `build/entitlements.mac.plist`
- [ ] Ter conta Apple Developer (USD 99/ano)
- [ ] Ter Mac físico com Xcode para assinar e notarizar
- [ ] Rodar `npm run build:mac` no Mac
- [ ] Rodar `xcrun notarytool submit ...`
- [ ] Rodar `xcrun stapler staple ...`

### Para Mac App Store (MAS)
- [ ] Criar `build/entitlements.mas.plist`
- [ ] Criar `build/entitlements.mas.inherit.plist`
- [ ] ⚠️ Resolver conflito do mediasoup com App Sandbox (limitação técnica grave)
- [ ] Criar app no App Store Connect
- [ ] Upload via Xcode Organizer

### Para Microsoft Store
- [ ] Adicionar `"appx"` ao `package.json`
- [ ] Criar ícones PNG nos tamanhos exigidos
- [ ] Criar conta no Partner Center (USD 19 taxa única)
- [ ] Rodar `npm run build:win` no Windows
- [ ] Upload do `.appx` no Partner Center

---

> [!NOTE]
> A estrutura do **código-fonte** (`src/`, `electron/`) está bem organizada e não precisa de alterações. O que falta são apenas **arquivos de configuração de build e ícones** para as stores.
