# ViewSync — Mac App Store: o bloqueio real e a alternativa local

---

## Resposta direta

| Pergunta | Resposta |
|---|---|
| Consigo subir **como está hoje** na Mac App Store? | ❌ **Não** |
| Existe outro jeito de rodar **100% local sem internet**? | ✅ **Sim** |
| Esse jeito alternativo cabe na MAS? | ✅ **Sim** |
| Precisa de nuvem ou servidor externo? | ❌ **Não** |

---

## Por que o Mediasoup bloqueia a MAS — explicação simples

O Mediasoup funciona assim internamente:

```
Electron App
    │
    ├── Renderer (React UI)
    │
    └── Fork → mediasoup-worker   ← AQUI está o problema
                    │
                    └── Binário C++ compilado (~15 MB)
                        Abre portas UDP 40000-41000
                        Executa código nativo não-assinado
```

A Apple exige que apps na MAS rodem em **App Sandbox**. O Sandbox bloqueia:

- ❌ Executar binários externos não-assinados pela Apple (o worker C++ do mediasoup)
- ❌ Abrir sockets UDP em portas arbitrárias (o WebRTC usa UDP intensivamente)
- ❌ Fazer `fork()` de processos filhos com código nativo arbitrário

Não existe configuração de entitlement que desbloqueie isso para a MAS — é uma restrição de design intencional da Apple.

**O problema não é o WebRTC em si. É o mediasoup como biblioteca de SFU.**

---

## A alternativa: MediaRecorder + WebSocket (100% local, sem nuvem)

Existe uma arquitetura completamente diferente que:
- Funciona 100% na LAN (sem internet)
- Não usa mediasoup nem nenhum binário nativo
- É compatível com o App Sandbox da MAS
- Suporta múltiplos alunos simultâneos
- Usa apenas APIs nativas do Electron e do navegador

### Como funciona

```
ARQUITETURA ATUAL (mediasoup WebRTC)
─────────────────────────────────────
Professor (Electron)
    │
    ├── desktopCapturer → MediaStream
    │
    ├── mediasoup-client → WebRTC (UDP)  ← binário nativo, bloqueia MAS
    │
    └── Mediasoup SFU Server (processo filho C++) ← binário nativo, bloqueia MAS
            │ UDP 40000-41000
            ▼
        Alunos (Browser) via WebRTC


ARQUITETURA ALTERNATIVA (MediaRecorder + WebSocket)
────────────────────────────────────────────────────
Professor (Electron)
    │
    ├── desktopCapturer → MediaStream   ← continua igual ✅
    │
    ├── MediaRecorder (API nativa do browser)  ← sem binário nativo ✅
    │       encoda em WebM (VP8/VP9)
    │       gera chunks a cada 200-500ms
    │
    └── Servidor WebSocket (Node.js puro)  ← sem binário nativo ✅
            │ TCP porta 3000 (permitido pelo sandbox)
            │ Broadcast de chunks para todos os alunos
            ▼
        Alunos (Browser) via MediaSource Extensions (MSE)
        → <video> toca os chunks em tempo real
```

### Tecnicamente: o que muda e o que fica igual

| Componente | Hoje | Alternativa |
|---|---|---|
| Captura de tela | `desktopCapturer` ✅ | `desktopCapturer` ✅ (igual) |
| Codificação de vídeo | mediasoup (C++) ❌ sandbox | `MediaRecorder` API ✅ nativo |
| Transporte | WebRTC UDP ❌ sandbox | WebSocket TCP ✅ permitido |
| Servidor | mediasoup worker (C++) ❌ | `ws` ou `socket.io` puro JS ✅ |
| Múltiplos viewers | SFU (sem re-encoding) | Broadcast de chunks ✅ |
| Compatibilidade MAS | ❌ Bloqueado | ✅ Funciona |

### Por que WebSocket TCP é permitido no Sandbox e UDP não?

A Apple permite `com.apple.security.network.server` no sandbox, que libera **TCP**. O WebSocket usa TCP. Servidores HTTP também usam TCP.

O que a Apple bloqueia é o uso de **sockets UDP sem restrição de porta** — que é exatamente como o WebRTC/mediasoup funciona.

---

## Qualidade e latência: comparação real

| Métrica | Mediasoup (atual) | MediaRecorder + WebSocket |
|---|---|---|
| Latência típica | 80–200ms | 300–800ms |
| Qualidade de vídeo | Excelente (VP8/H264 hardware) | Boa (VP8/VP9 via software) |
| FPS máximo | 30–60 FPS | 15–30 FPS |
| Uso de CPU no professor | Médio (encoding GPU) | Médio/Alto (encoding software) |
| Uso de rede | Eficiente (SFU sem re-encoding) | Razoável (broadcast de chunks) |
| Suporte de viewers simultâneos | Ilimitado (SFU) | ~20–50 (broadcast TCP) |

### Para sala de aula isso importa?

Para um professor mostrando slides, código ou demonstrações em sala:

- **300–800ms de latência** → completamente invisível. Ninguém nota.
- **15–30 FPS** → mais que suficiente para conteúdo educacional
- **20–50 viewers** → mais do que o tamanho de qualquer turma

Onde importaria ser diferente: streaming de jogos, transmissão ao vivo para centenas. Não é o caso do ViewSync.

---

## O que precisaria mudar no código

### Remover
- `mediasoup` (dependência)
- `mediasoup-client` (dependência)
- `electron/signaling/MediasoupEngine.ts`
- Toda a lógica de WebRTC (`createWebRtcTransport`, `produce`, `consume`, `resume`)

### Adicionar (simples)
- `MediaRecorder` no renderer do professor (captura → chunks WebM)
- Servidor WebSocket simples em Node.js puro (broadcast de chunks)
- `MediaSource Extensions (MSE)` no viewer dos alunos (recebe chunks → toca vídeo)

### Manter (sem alteração)
- `desktopCapturer` e seleção de fontes
- UI inteira (React, componentes, identidade, etc.)
- Autenticação com matrícula e senha
- Socket.IO para sinalização (conectar, listar viewers, etc.)
- Toda a arquitetura DDD (domain, application, infrastructure)

### Esforço estimado: 🟡 Médio — 1 a 2 semanas

O conceito é simples, mas há detalhes de sincronização do `MediaSource` que exigem cuidado (timestamps de chunk, codecs, `sourceBuffer.appendBuffer`). Não é uma reescrita do zero — é uma substituição cirúrgica do motor de vídeo.

---

## Alternativa 2 (mais simples, menor qualidade): MJPEG over WebSocket

Se quiser algo ainda mais simples, existe a abordagem MJPEG:

```
Professor:
    desktopCapturer → Canvas → toBlob(JPEG) a cada 50ms → WebSocket

Aluno:
    WebSocket → recebe blob → URL.createObjectURL → <img src=...>
```

- ✅ Funciona no sandbox
- ✅ Latência ~100–200ms
- ✅ Código extremamente simples
- ❌ Não é vídeo real (sem compressão temporal entre frames)
- ❌ Muito mais pesado na rede (cada frame é uma imagem completa ~50–200 KB)
- ❌ Sem áudio (MJPEG é só imagem)

Para um professor mostrando a tela com slides, pode funcionar. Para vídeo fluido, não.

---

## Recomendação

```
┌─────────────────────────────────────────────────────────────┐
│  Você quer publicar na MAS?                                  │
│                                                              │
│  SIM → Implementar MediaRecorder + WebSocket (1-2 semanas)  │
│                                                              │
│  NÃO → Distribuição direta com notarização (caminho atual)  │
│         Funciona HOJE, sem mudança de código                 │
│         Mesma qualidade de vídeo, sem restrição de viewers   │
└─────────────────────────────────────────────────────────────┘
```

**Se o objetivo é funcionar na rede local sem internet**, a distribuição direta com notarização já resolve — você distribui o `.dmg` para os professores, eles instalam, e o app funciona 100% local. A MAS seria apenas um canal de distribuição mais conveniente, não um requisito funcional.

---

## Resumo final

| Cenário | Possível? | O que fazer |
|---|---|---|
| App Store hoje (com mediasoup) | ❌ Não | — |
| App Store com nova arquitetura (MediaRecorder+WS) | ✅ Sim | Reescrita do motor de vídeo (~1-2 semanas) |
| Distribuição direta (.dmg notarizado) | ✅ Sim, hoje | Só precisa de um Mac para buildar e notarizar |
| Funcionar 100% local sem internet | ✅ Sim (ambos) | Já funciona — é a proposta do app |
| Usar nuvem ou servidor externo | ❌ Desnecessário | Nenhuma das abordagens precisa disso |

---

*Documento gerado em 25/05/2026 · ViewSync Studio v1.0.4*
