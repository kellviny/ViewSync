# ViewSync — OvenMediaEngine vs LiveKit vs Janus: análise honesta

> Contexto: você quer manter qualidade de imagem máxima, latência baixa, muitas conexões simultâneas e 100% local na LAN. A pergunta é se algum desses SFUs resolve o bloqueio da Mac App Store sem sacrificar desempenho.

---

## A verdade incômoda que precisa ser dita primeiro

**O problema com a MAS não é o mediasoup especificamente. É qualquer SFU.**

Todo SFU de alta performance — mediasoup, LiveKit, OvenMediaEngine, Janus — funciona da mesma forma:

```
Electron App
    └── fork() ou spawn() → binário nativo (C++, Go, C)
                                └── sockets UDP para WebRTC
```

O App Sandbox da Apple bloqueia exatamente esse padrão. **Trocar mediasoup por outro SFU não resolve o problema da MAS.**

Com isso claro, a análise abaixo compara os três SFUs em termos de **desempenho real** — assumindo distribuição direta (`.dmg` notarizado), que é o que você pode usar hoje.

---

## Comparativo técnico

### 🔵 Mediasoup (o que você usa hoje)

| Critério | Avaliação |
|---|---|
| Linguagem do core | C++ (máxima performance) |
| Latência WebRTC | Sub-100ms ✅ |
| Usuários simultâneos | Centenas por instância ✅ |
| Integração com Electron/Node.js | Nativa via npm ✅ (`npm install mediasoup`) |
| Precisa de processo separado? | Sim, mas como módulo Node (child_process fork) |
| Setup | Moderado |
| Compatível com MAS Sandbox | ❌ |
| Compatível com dist. direta (.dmg) | ✅ |

**Resumo:** É a **melhor opção para embedding em Electron**. Ele foi desenhado exatamente para isso — é uma biblioteca Node.js que o app inicia, não um daemon externo. Tem a performance de C++ com a conveniência de npm.

---

### 🟡 LiveKit

| Critério | Avaliação |
|---|---|
| Linguagem do core | Go |
| Latência WebRTC | Sub-100ms ✅ |
| Usuários simultâneos | Milhares (escalabilidade horizontal) ✅ |
| Integração com Electron/Node.js | ❌ Precisa de binário Go separado |
| Precisa de processo separado? | Sim — `livekit-server` é um binário Go standalone |
| Setup | Alto |
| Compatível com MAS Sandbox | ❌ (mesmo bloqueio do mediasoup) |
| Compatível com dist. direta (.dmg) | ✅ (com mais trabalho) |

**Como seria a integração no ViewSync:**

```
Electron App
    └── spawn() → livekit-server (binário Go ~40 MB)
                      └── porta 7880 (HTTP signaling)
                      └── porta 7881 (WebRTC)
                      └── UDP 50000-60000

Renderer (React)
    └── livekit-client (SDK JavaScript) → conecta no server
```

**Problemas práticos:**
1. O binário do livekit-server pesa ~40 MB e é específico por arquitetura (Intel vs. Apple Silicon — precisaria de um fat binary ou dois builds)
2. Precisaria gerar um binário para Mac, que normalmente é distribuído como servidor Linux
3. A configuração do LiveKit exige um arquivo YAML com chaves de API e segredos — mais complexidade para o usuário final
4. O SDK client (`livekit-client`) é excelente e muito bem documentado
5. Mas o SDK não é um drop-in para o mediasoup-client — requer reescrita significativa da camada de WebRTC

**Performance vs. mediasoup:**
- LiveKit (Go) tem overhead do garbage collector do Go — na prática, mediasoup usa ~15–20% menos CPU por stream
- Para sala de aula com 20–50 alunos, essa diferença é irrelevante
- Para 500+ viewers, mediasoup começaria a vencer no mesmo hardware

**Verdict: 🟡 Tecnicamente viável, mas mais trabalho, mais tamanho de bundle, sem ganho real no seu caso de uso.**

---

### 🔴 OvenMediaEngine (OME)

| Critério | Avaliação |
|---|---|
| Linguagem do core | C++ |
| Latência | Sub-50ms (especializado em broadcast) ✅✅ |
| Usuários simultâneos | Centenas de milhares ✅✅ |
| Integração com Electron/Node.js | ❌❌ Praticamente inviável |
| Precisa de processo separado? | Sim — daemon de servidor pesado |
| Setup | Muito alto |
| Compatível com MAS Sandbox | ❌ |
| Compatível com dist. direta (.dmg) | 🟡 (com muito trabalho) |

**Por que é inviável no ViewSync:**

O OME é um **servidor de mídia pesado**, equivalente a embutir o nginx ou o FFmpeg no seu app. Ele foi projetado para:
- Rodar em servidores Linux dedicados
- Receber streams RTMP/SRT/WebRTC de encoders externos
- Distribuir para audiências massivas via CDN

Não foi projetado para ser embarcado em uma aplicação desktop. Para usar no ViewSync você precisaria:

1. Compilar o OME para macOS (suporte parcial — o projeto foca Linux)
2. Bundlar um binário de ~200 MB no app
3. Criar um novo cliente WebRTC próprio (o OME usa o protocolo OVT para signaling, não Socket.IO)
4. Reescrever completamente a camada de streaming

**O OME foi feito para o cenário oposto do ViewSync:** OME = muitos viewers, uma fonte de entrada. ViewSync = uma fonte de captura, muitos viewers na LAN. São casos de uso similares mas a integração seria completamente diferente do que existe hoje.

**Verdict: ❌ Inviável para embedding em Electron. Criaria mais problemas do que resolve.**

---

### 🔴 Janus

| Critério | Avaliação |
|---|---|
| Linguagem do core | C |
| Latência WebRTC | Sub-100ms ✅ |
| Usuários simultâneos | Centenas (por instância, sem clustering nativo) |
| Integração com Electron/Node.js | ❌❌ Muito complexo |
| Precisa de processo separado? | Sim — daemon C com sistema de plugins |
| Setup | Muito alto (config files, plugins, signaling custom) |
| Compatível com MAS Sandbox | ❌ |
| Compatível com dist. direta (.dmg) | 🟡 (com muito trabalho) |

**Por que é a pior opção das três:**

O Janus é extremamente poderoso, mas é uma **ferramenta de baixo nível para especialistas**. Para fazer o que o mediasoup faz hoje no ViewSync, você precisaria:

1. Compilar o Janus com os plugins certos para macOS
2. Criar arquivos de configuração `.jcfg` para cada plugin (VideoRoom, Streaming, etc.)
3. Implementar o protocolo de signaling do Janus (diferente do Socket.IO atual)
4. Criar um cliente JavaScript do zero (não tem SDK equivalente ao mediasoup-client)

A comunidade usa Janus principalmente para integração com SIP/telefonia ou casos de uso muito específicos. Para um SFU simples de screen sharing, é overkill negativo — você ganha complexidade sem ganhar performance relevante.

**Verdict: ❌ Mais complexo que mediasoup, sem vantagem real para este caso de uso.**

---

## Tabela resumo comparativa

| Critério | Mediasoup (atual) | LiveKit | OvenMediaEngine | Janus |
|---|---|---|---|---|
| **Qualidade de imagem** | ✅ Igual | ✅ Igual | ✅ Igual | ✅ Igual |
| **Latência** | ~80ms | ~80ms | ~40ms | ~80ms |
| **Viewers simultâneos (LAN)** | Centenas | Centenas | Milhares | Centenas |
| **Integração com Electron** | ✅ Nativa (npm) | 🟡 Binário externo | ❌ Servidor pesado | ❌ Daemon complexo |
| **Resolve bloqueio da MAS** | ❌ | ❌ | ❌ | ❌ |
| **Esforço de migração** | — | 🔴 Alto (3–6 semanas) | 🔴🔴 Muito alto | 🔴🔴 Muito alto |
| **Tamanho do bundle adicionado** | Já incluído | +40 MB | +200 MB | +30 MB |
| **Performance no seu caso de uso** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

## Conclusão direta

> **Nenhum dos três SFUs resolve o problema da Mac App Store.** Todos exigem binários nativos como processo filho, que o App Sandbox bloqueia da mesma forma que bloqueia o mediasoup.

> **Para desempenho + qualidade + LAN + Electron, o mediasoup já é a melhor escolha possível.** Ele foi criado exatamente para esse caso de uso. Os outros adicionam complexidade sem ganho real.

---

## O que você PODE fazer para melhorar o mediasoup atual

Em vez de trocar de SFU, o ganho real de desempenho viria de:

### 1. Ajustar os codecs no `MediasoupEngine.ts`
Forçar VP8 ou H264 (com aceleração de hardware no Mac):
```ts
// Prefira H264 — usa aceleração GPU no Mac
{ kind: 'video', mimeType: 'video/H264', ... }
```

### 2. Aumentar o bitrate máximo
Atualmente sem limite explícito. Para sala de aula, 2–4 Mbps é ideal:
```ts
producer.setMaxSpatialLayer(2) // para simulcast
```

### 3. Habilitar Simulcast
O professor transmite 3 qualidades diferentes (baixa/média/alta). Alunos com conexão fraca recebem a versão comprimida, alunos com boa conexão recebem full. Sem mudança no servidor.

### 4. Ajustar as portas RTC no `config.ts`
Garantir que as portas UDP estejam abertas no firewall do professor.

---

## Recomendação final

```
┌────────────────────────────────────────────────────────────────┐
│  Quer Mac App Store?                                           │
│  → Nenhum SFU ajuda. Precisa de arquitetura completamente      │
│    diferente (MediaRecorder + WebSocket). Perda de qualidade.  │
│                                                                │
│  Quer melhor desempenho sem mudar de SFU?                      │
│  → Manter mediasoup + tunar codecs + habilitar simulcast.      │
│    Ganho real sem risco.                                        │
│                                                                │
│  Quer distribuir no Mac agora?                                 │
│  → .dmg notarizado. Funciona hoje. Zero custo adicional.       │
└────────────────────────────────────────────────────────────────┘
```

---

*Documento gerado em 25/05/2026 · ViewSync Studio v1.0.4*
