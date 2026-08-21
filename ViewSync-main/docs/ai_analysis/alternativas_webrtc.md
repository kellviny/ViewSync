# Transmissão Local sem WebRTC: A Verdade Técnica

> Você perguntou: Existe outro jeito de transmitir tela via rede local sem ser com WebRTC, que seja **tão bom quanto** é hoje com o SFU e mediasoup?

A resposta curta e dolorosa é: **NÃO. Se você quer qualidade máxima com latência quase zero no navegador, o WebRTC é a única tecnologia que existe para isso hoje.**

Vou explicar o porquê e apresentar a única alternativa real (que resolve a Apple Store, mas tem um custo).

---

## Por que o WebRTC (e o mediasoup) é imbatível?

O WebRTC foi inventado pelo Google e padronizado pelo W3C exatamente porque **não existia** uma forma boa de fazer vídeo em tempo real na web. 

1. **Usa UDP em vez de TCP:** O TCP (usado por HTTP, WebSockets) se importa muito com a ordem dos pacotes. Se um pacote de vídeo se perde na rede Wi-Fi da escola, o TCP para *tudo*, pede o pacote de novo, e só depois continua. Isso gera "engasgos" e atraso (buffer). O UDP (usado pelo WebRTC) não liga: se perdeu um frame de vídeo, ele ignora e mostra o próximo. O vídeo continua fluindo instantaneamente.
2. **Adaptação de Rede:** Se o Wi-Fi de um aluno ficar ruim, o WebRTC percebe em milissegundos e reduz a qualidade *só para aquele aluno*, sem derrubar a transmissão.
3. **Latência de Hardware:** O WebRTC conversa diretamente com a placa de vídeo para codificar/decodificar.

**Resultado com Mediasoup:** ~80 milissegundos de latência. É como se os alunos estivessem olhando para o seu monitor.

---

## A única alternativa viável para navegadores: MSE + WebSockets

Se você **precisa** jogar o mediasoup fora (para entrar na Apple Store, por exemplo), a única forma de transmitir vídeo para um navegador comum (Chrome, Safari, Edge) sem WebRTC é usando **MSE (MediaSource Extensions) via WebSockets**.

### Como funciona:
1. O seu app capta a tela (`desktopCapturer`).
2. Usa a API `MediaRecorder` para gravar a tela em "pedacinhos" (chunks) de vídeo a cada meio segundo (ex: formato WebM).
3. O servidor Node.js (permitido pela Apple) envia esses pedacinhos via WebSocket para os alunos.
4. O navegador dos alunos pega esses pedaços e vai colando um no outro usando MSE (`SourceBuffer`), tocando o vídeo contínuo.

### A Comparação: Mediasoup vs MSE + WebSocket

| Critério | Mediasoup (WebRTC) | MSE + WebSockets | Veredito |
| :--- | :--- | :--- | :--- |
| **Latência (Atraso)** | **~0.08 segundos** (Instantâneo) | **1 a 3 segundos** | ❌ MSE perde feio. O TCP obriga a ter buffer. |
| **Qualidade de Imagem** | Perfeita (GPU Encoding) | Muito Boa (Software/Browser) | 🟡 WebRTC é um pouco melhor. |
| **Fluidez em Wi-Fi ruim** | Excelente (pula frames perdidos) | Engasga (o TCP tenta reenviar pacotes) | ❌ MSE trava mais em redes instáveis. |
| **Escalabilidade (Alunos)** | Alta (O SFU gerencia bem) | Alta (Node.js broadcasta fácil) | 🤝 Empate (para 50-100 alunos locais). |
| **Compatível com Mac App Store**| ❌ Não (bloqueado pelo Sandbox) | ✅ Sim (usa apenas rede TCP padrão) | ✅ MSE ganha. |
| **Precisa de app no aluno?** | Não (só navegador) | Não (só navegador) | 🤝 Empate. |

---

## Outras Tecnologias (Por que não servem)

*   **HLS ou DASH (Twitch, YouTube):** Latência de 10 a 30 segundos. Inviável para dar aula.
*   **WebTransport / WebCodecs:** É muito novo. Você teria que programar a compressão de vídeo e o protocolo de rede do absoluto zero, na mão. Demoraria meses.
*   **NDI / SRT:** Qualidade espetacular de TV, mas os alunos teriam que baixar um programa pesado para assistir. Não roda no navegador.

---

## Conclusão

Se você quer uma experiência **"tão boa quanto hoje"** (clique no professor = clique no aluno na mesma hora), você **precisa** manter o WebRTC e o mediasoup. Não existe mágica de software que vença a física de redes (UDP vs TCP).

Se você aceitar que a tela do professor vai aparecer no aluno com **1 a 3 segundos de atraso**, a alternativa de MSE + WebSocket funciona muito bem, tira a dependência de código C++ (mediasoup) e resolve todos os problemas de publicação na Apple Store.

**A decisão é:** A latência instantânea é inegociável para a sua aplicação? Se sim, fique com o mediasoup e use a distribuição fora da loja para Mac (.dmg notarizado, que funciona perfeitamente).
