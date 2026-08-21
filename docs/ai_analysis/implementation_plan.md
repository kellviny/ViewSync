# Plano de Implementação: ViewSync na Mac App Store (com mediasoup)

**Objetivo:** Publicar o ViewSync Studio na Mac App Store (MAS) sem alterar a arquitetura atual (mantendo o mediasoup, alta qualidade de vídeo, latência quase zero e rede local), resolvendo o bloqueio do App Sandbox.

---

## ⚠️ User Review Required

> [!WARNING]
> **Risco de Rejeição da Apple:** Embora esta técnica (assinar binários C++ aninhados e forçar herança de sandbox) seja tecnicamente viável e resolva os bloqueios de sistema do macOS, o processo de revisão da Mac App Store é rigoroso e, por vezes, subjetivo. A Apple pode questionar o uso extensivo de portas UDP locais por um processo filho.
> 
> **Você está de acordo em seguir por este caminho, ciente de que pode haver idas e vindas no processo de aprovação da Apple?**

---

## A Estratégia Técnica (Como vamos enganar o Sandbox)

O problema atual é que o Electron chama o `mediasoup-worker` direto da pasta `node_modules` como um processo "solto". O Sandbox da Apple entra em pânico ao ver um binário não-registrado abrindo portas UDP e bloqueia tudo.

A solução é transformar o `mediasoup-worker` em um "filho legítimo e registrado" do seu aplicativo.

## Mudanças Propostas

### 1. Extração e Empacotamento do Binário
Vamos configurar o `electron-builder` para copiar o executável do `mediasoup-worker` para dentro da pasta protegida `Contents/Resources/bin` do aplicativo final.

#### [MODIFY] `package.json`
Atualizar o bloco `extraResources` para incluir o worker do mediasoup, garantindo que o `electron-builder` o veja e o assine digitalmente com os certificados da Mac App Store:
```json
"extraResources": [
  { "from": "../viewer-web/out", "to": "viewer", "filter": ["**/*"] },
  { "from": "node_modules/mediasoup/worker/out/Release/mediasoup-worker", "to": "bin/mediasoup-worker" }
]
```
Também adicionaremos um script para garantir que os binários da pasta `extraResources` recebam os *entitlements* herdados (`build/entitlements.mas.inherit.plist`).

### 2. Apontamento Dinâmico no Código
Temos que avisar o código Node.js que ele não deve mais procurar o mediasoup na pasta `node_modules`, e sim na nossa nova pasta segura `Resources/bin`.

#### [MODIFY] `apps/desktop-transmissor/electron/signaling/MediasoupEngine.ts`
Antes de inicializar o worker (`mediasoup.createWorker()`), vamos injetar o caminho absoluto do nosso binário assinado usando a variável de ambiente `MEDIASOUP_WORKER_BIN`.

```typescript
import path from 'node:path'
import { IS_PACKAGED, RESOURCES_PATH } from './config'

export class MediasoupEngine {
  public async initialize(rtcMinPort: number, rtcMaxPort: number): Promise<void> {
    
    // NOVO CÓDIGO: Aponta para o binário assinado se estiver em produção
    if (IS_PACKAGED) {
      process.env.MEDIASOUP_WORKER_BIN = path.join(RESOURCES_PATH, 'bin', 'mediasoup-worker');
    }

    this.worker = await mediasoup.createWorker({ ... })
    // ...
  }
}
```

### 3. Garantir as Permissões (Entitlements)
Os arquivos que criamos anteriormente (`entitlements.mas.plist` e `entitlements.mas.inherit.plist`) já estão corretos. O `network.server` e `network.client` garantem que as portas UDP 40000-41000 possam ser abertas pelo aplicativo sandboxed.

## Plano de Verificação

### Teste Local (Fora do Sandbox)
1. Rodar `npm run build:mac` para gerar o `.dmg`.
2. Instalar o `.dmg` gerado no Mac local e testar uma transmissão para garantir que o redirecionamento do binário (`MEDIASOUP_WORKER_BIN`) funcionou.

### Teste de Sandbox (Preparação para MAS)
1. É necessário rodar o build específico para a MAS: `electron-builder --mac mas` (precisaremos adicionar um script para isso).
2. O aplicativo gerado (`.app` ou `.pkg`) não rodará diretamente no seu Mac se for assinado com o certificado de Distribuição da Apple (só roda se baixado da loja ou assinado com perfil de desenvolvimento).
3. Usaremos o comando `codesign -dv --entitlements - /caminho/para/ViewSync.app/Contents/Resources/bin/mediasoup-worker` para confirmar que o binário do mediasoup recebeu a herança do sandbox corretamente antes de você enviar para a Apple.
