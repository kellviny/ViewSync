import os from 'node:os'
import { execFile } from 'node:child_process'

const VIRTUAL_PREFIXES = [
  'loopback', 'vmware', 'virtualbox', 'vbox', 'wsl', 'docker',
  'vethernet', 'hyper-v', 'npcap', 'bluetooth', 'pseudo', 'teredo',
  'awdl', 'llw', 'utun', 'ipsec', 'gif', 'stf', 'ap1', 'bridge',
]

const SSID_TTL_MS = 15_000
// O macOS devolve literalmente `<redacted>` quando o processo não tem
// autorização de Serviços de Localização para ler o SSID.
const REDACTED_MARKERS = ['<redacted>', 'redacted']

export type NetworkDetails = {
  ip: string
  network: string
  /** Nome bruto da interface (en0, Wi-Fi, wlan0...) usado internamente. */
  interfaceName: string
  /** SSID real, quando o SO permite ler. `null` = indisponível (sem permissão / cabo). */
  ssid: string | null
}

type SsidCache = { value: string | null; at: number }

let ssidCache: SsidCache | null = null
let lastDetails: NetworkDetails | null = null

/** Executa um binário do sistema sem shell; nunca rejeita, nunca imprime erro. */
function run(cmd: string, args: string[], timeout = 2000): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      resolve(value)
    }

    try {
      const child = execFile(cmd, args, { timeout, killSignal: 'SIGKILL' }, (error, stdout) => {
        if (error || !stdout) return finish(null)
        finish(stdout)
      })
      child.on('error', () => finish(null))
    } catch {
      finish(null)
    }
  })
}

const isUsableSsid = (value: string | null | undefined): value is string => {
  if (!value) return false
  const normalized = value.trim().replace(/^"|"$/g, '')
  if (!normalized) return false
  return !REDACTED_MARKERS.some((marker) => normalized.toLowerCase() === marker)
}

const cleanSsid = (value: string): string => value.trim().replace(/^"|"$/g, '')

// ─────────────────────────── Interfaces IPv4 ───────────────────────────

const isVirtual = (name: string) =>
  VIRTUAL_PREFIXES.some((prefix) => name.toLowerCase().includes(prefix))

type RawInterface = { name: string; ip: string }

function listUsableInterfaces(): RawInterface[] {
  const ifaces = os.networkInterfaces()
  const list: RawInterface[] = []

  for (const name of Object.keys(ifaces)) {
    if (isVirtual(name)) continue

    for (const iface of ifaces[name] || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      if (iface.address.startsWith('192.168.56.')) continue // VirtualBox host-only
      if (iface.address.startsWith('169.254.')) continue // link-local (sem DHCP)
      list.push({ name, ip: iface.address })
    }
  }

  return list
}

/** Interface "principal": prioriza faixas domésticas/institucionais comuns. */
function pickPrimaryInterface(): RawInterface | null {
  const list = listUsableInterfaces()
  if (list.length === 0) return null

  const preferred = list.find(
    (item) => item.ip.startsWith('192.168.0.') || item.ip.startsWith('192.168.1.')
  )

  return preferred ?? list[0]
}

export function getNetworkIp(): string {
  return pickPrimaryInterface()?.ip ?? '127.0.0.1'
}

export function getAllNetworkInterfaces(): { name: string; ip: string }[] {
  return listUsableInterfaces().map(({ name, ip }) => ({
    name: friendlyInterfaceName(name),
    ip,
  }))
}

/**
 * Assinatura barata do estado da rede (sem spawn de processos).
 * Serve para detectar troca de rede/IP a cada tick sem custo.
 */
export function getInterfaceSignature(): string {
  return listUsableInterfaces()
    .map(({ name, ip }) => `${name}=${ip}`)
    .sort()
    .join('|')
}

// ─────────────────────────── macOS ───────────────────────────

/** device (en0) -> nome amigável ("Wi-Fi", "Ethernet"), preenchido no macOS. */
let macHardwarePorts: Map<string, string> | null = null
let macWifiDevice: string | null = null

async function loadMacHardwarePorts(): Promise<void> {
  if (macHardwarePorts) return

  macHardwarePorts = new Map()
  const stdout = await run('/usr/sbin/networksetup', ['-listallhardwareports'], 3000)
  if (!stdout) return

  const blocks = stdout.split(/\n\s*\n/)
  for (const block of blocks) {
    const port = block.match(/^Hardware Port:\s*(.+)$/m)?.[1]?.trim()
    const device = block.match(/^Device:\s*(.+)$/m)?.[1]?.trim()
    if (!port || !device) continue

    macHardwarePorts.set(device, port)
    if (!macWifiDevice && /wi-?fi|airport/i.test(port)) macWifiDevice = device
  }
}

/**
 * SSID no macOS moderno (13+).
 *
 * O binário `airport` foi removido no macOS 14.4, e a partir do Sonoma/Sequoia
 * o SSID só é revelado a processos autorizados em Serviços de Localização —
 * caso contrário o sistema devolve `<redacted>` (ipconfig) ou
 * "You are not associated with an AirPort network." (networksetup).
 * Tentamos as fontes em ordem e devolvemos `null` silenciosamente se nenhuma
 * puder responder, em vez de propagar erro.
 */
async function getMacSsid(): Promise<string | null> {
  await loadMacHardwarePorts()

  const devices = macWifiDevice ? [macWifiDevice] : ['en0', 'en1']

  for (const device of devices) {
    // 1) ipconfig getsummary — fonte mais rápida e disponível
    const summary = await run('/usr/sbin/ipconfig', ['getsummary', device], 2000)
    const fromSummary = summary?.match(/^\s*SSID\s*:\s*(.+)$/m)?.[1]
    if (isUsableSsid(fromSummary)) return cleanSsid(fromSummary)

    // 2) networksetup — funciona quando o app tem permissão de Localização
    const airport = await run('/usr/sbin/networksetup', ['-getairportnetwork', device], 2500)
    const fromAirport = airport?.match(/^Current [^:]*Network:\s*(.+)$/m)?.[1]
    if (isUsableSsid(fromAirport)) return cleanSsid(fromAirport)
  }

  return null
}

// ─────────────────────────── Windows / Linux ───────────────────────────

async function getWindowsSsid(): Promise<string | null> {
  const stdout = await run('netsh', ['wlan', 'show', 'interfaces'], 2500)
  const match = stdout?.match(/^\s*SSID\s*:\s*(.+)$/m)?.[1]
  return isUsableSsid(match) ? cleanSsid(match) : null
}

async function getLinuxSsid(): Promise<string | null> {
  const nmcli = await run('nmcli', ['-t', '-f', 'active,ssid', 'dev', 'wifi'], 2500)
  const fromNmcli = nmcli?.match(/^(?:yes|sim):(.+)$/im)?.[1]
  if (isUsableSsid(fromNmcli)) return cleanSsid(fromNmcli)

  const iwgetid = await run('iwgetid', ['-r'], 2000)
  if (isUsableSsid(iwgetid)) return cleanSsid(iwgetid)

  const iwDev = await run('iw', ['dev'], 2000)
  const iface = iwDev?.match(/Interface\s+(\S+)/)?.[1]
  if (!iface) return null

  const link = await run('iw', [iface, 'link'], 2000)
  const fromIw = link?.match(/SSID:\s*(.+)/i)?.[1]
  return isUsableSsid(fromIw) ? cleanSsid(fromIw) : null
}

async function getSsid(): Promise<string | null> {
  if (process.platform === 'darwin') return getMacSsid()
  if (process.platform === 'win32') return getWindowsSsid()
  return getLinuxSsid()
}

// ─────────────────────────── Nomes amigáveis ───────────────────────────

function friendlyInterfaceName(rawName: string): string {
  if (process.platform === 'darwin') {
    const port = macHardwarePorts?.get(rawName)
    if (port) return port
  }
  return rawName
}

// ─────────────────────────── API pública ───────────────────────────

/**
 * Detalhes da rede atual.
 *
 * `force` invalida apenas o cache de SSID (a leitura de IP já é barata e sempre
 * feita na hora). Sem `force`, o SSID é reaproveitado por {@link SSID_TTL_MS},
 * evitando um spawn de processo a cada tick do monitor de rede.
 */
export async function getNetworkDetails(force = false): Promise<NetworkDetails> {
  if (process.platform === 'darwin') await loadMacHardwarePorts()

  const primary = pickPrimaryInterface()
  const ip = primary?.ip ?? '127.0.0.1'
  const interfaceName = primary?.name ?? 'lo'

  const now = Date.now()
  const cacheValid = !force && ssidCache !== null && now - ssidCache.at < SSID_TTL_MS

  let ssid: string | null
  if (cacheValid) {
    ssid = ssidCache!.value
  } else {
    ssid = await getSsid()
    ssidCache = { value: ssid, at: now }
  }

  const details: NetworkDetails = {
    ip,
    interfaceName,
    ssid,
    network: ssid ?? friendlyInterfaceName(interfaceName),
  }

  lastDetails = details
  return details
}

export function getLastNetworkDetails(): NetworkDetails | null {
  return lastDetails
}

/** Invalida o cache de SSID — use ao detectar troca de interface/IP. */
export function invalidateSsidCache(): void {
  ssidCache = null
}
