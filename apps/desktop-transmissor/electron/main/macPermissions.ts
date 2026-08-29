import { app, desktopCapturer, shell, systemPreferences } from 'electron'
import dgram from 'node:dgram'

const SCREEN_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture'

/** Marca o processo reiniciado por concessão de permissão (evita loop). */
const RELAUNCH_MARKER = 'LANVIEW_PERMISSION_RELAUNCH'

const isMac = () => process.platform === 'darwin'

export type ScreenAccessStatus = 'granted' | 'denied' | 'restricted' | 'not-determined' | 'unknown'

export const getScreenAccessStatus = (): ScreenAccessStatus => {
  if (!isMac()) return 'granted'

  try {
    return systemPreferences.getMediaAccessStatus('screen') as ScreenAccessStatus
  } catch {
    return 'unknown'
  }
}

/**
 * Pede a permissão de Gravação de Tela — uma única vez, por ação explícita.
 *
 * Quem dispara o alerta do sistema é a própria chamada a
 * `desktopCapturer.getSources()`: enquanto não há permissão, toda chamada faz o
 * alerta reaparecer. Por isso ela nunca é feita em intervalo — só aqui, quando
 * o usuário clica em autorizar.
 */
/** Impede que cliques repetidos empilhem alertas do sistema. */
let promptInFlight = false

/**
 * Executado antes de qualquer app.exit() nosso.
 *
 * `app.exit()` não dispara 'before-quit', que é onde o servidor é encerrado —
 * sem este gancho o processo do servidor fica órfão com a porta 3000 presa.
 */
let exitCleanup: (() => void) | null = null

export const setExitCleanup = (fn: () => void): void => {
  exitCleanup = fn
}

const exitApp = (): void => {
  try {
    exitCleanup?.()
  } catch {
    /* noop */
  }
  app.exit(0)
}

export const requestScreenAccess = async (openSettings: boolean): Promise<ScreenAccessStatus> => {
  if (!isMac()) return 'granted'

  const current = getScreenAccessStatus()
  if (current === 'granted') return current

  // Para 'screen' o Electron devolve apenas 'granted' ou 'denied' — nunca
  // 'not-determined'. Ou seja, 'denied' cobre tanto "nunca perguntado" quanto
  // "recusado", e não dá para distinguir os dois pelo status. A única forma de
  // registrar o app na lista de Ajustes é tentar capturar, então tentamos
  // sempre — mas só aqui, a partir de um clique, e no máximo uma vez por vez.
  if (!promptInFlight) {
    promptInFlight = true
    try {
      // Thumbnail 1x1: o objetivo é só registrar o app na lista de Ajustes.
      await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1, height: 1 },
      })
    } catch {
      // Negativa é esperada enquanto a permissão não existe.
    } finally {
      promptInFlight = false
    }
  }

  if (openSettings) {
    void shell.openExternal(SCREEN_SETTINGS_URL)
  }

  watchForScreenPermission()
  return getScreenAccessStatus()
}

/**
 * Registra o app na lista de "Gravação de Tela" dos Ajustes.
 *
 * O macOS só lista um app depois que ele tenta capturar pelo menos uma vez —
 * antes disso não existe linha para o usuário marcar. Roda uma única vez por
 * processo, no boot: o alerta do sistema aparece uma vez, como em qualquer app
 * de captura, e nunca em intervalo (era o intervalo que criava o loop).
 */
export const registerForScreenPermission = async (): Promise<void> => {
  if (!isMac()) return
  if (getScreenAccessStatus() === 'granted') return

  await requestScreenAccess(false)
}

/** Reinicia o app — necessário porque o macOS não aplica o TCC ao processo vivo. */
export const restartApp = (): void => {
  app.relaunch()
  exitApp()
}

/**
 * Dispara o pedido de "Rede Local" (obrigatório a partir do macOS 15).
 *
 * Sem essa permissão o servidor sobe normalmente, mas nenhum aluno da LAN
 * consegue abrir a página — sintoma que costuma ser confundido com "o app não
 * funcionou na primeira vez". Um único datagrama multicast basta.
 */
export const primeLocalNetworkPermission = (): void => {
  if (!isMac()) return

  try {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true })
    socket.once('error', () => socket.close())
    socket.send(Buffer.alloc(1), 5353, '224.0.0.251', () => {
      try {
        socket.close()
      } catch {
        /* noop */
      }
    })
  } catch {
    /* noop */
  }
}

let permissionWatcher: NodeJS.Timeout | null = null

/**
 * Observa a concessão da permissão e reinicia o app quando ela chega — o TCC do
 * macOS não aplica a autorização ao processo que já está rodando.
 *
 * O reinício acontece **no máximo uma vez**: o processo reiniciado carrega
 * {@link RELAUNCH_MARKER} no ambiente e não volta a observar, de modo que uma
 * leitura instável do status não possa encadear reinícios infinitos.
 */
export const watchForScreenPermission = (): void => {
  if (!isMac()) return
  if (permissionWatcher) return
  if (process.env[RELAUNCH_MARKER] === '1') return
  if (getScreenAccessStatus() === 'granted') return

  permissionWatcher = setInterval(() => {
    if (getScreenAccessStatus() !== 'granted') return

    clearInterval(permissionWatcher!)
    permissionWatcher = null

    // Definido antes do relaunch para ser herdado pelo processo novo.
    process.env[RELAUNCH_MARKER] = '1'
    app.relaunch()
    exitApp()
  }, 2000)

  permissionWatcher.unref?.()
}

export const stopScreenPermissionWatch = (): void => {
  if (!permissionWatcher) return
  clearInterval(permissionWatcher)
  permissionWatcher = null
}
