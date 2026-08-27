import os from 'node:os'
import { exec } from 'node:child_process'

const VIRTUAL_PREFIXES = [
  'loopback', 'vmware', 'virtualbox', 'vbox', 'wsl', 'docker',
  'vethernet', 'hyper-v', 'npcap', 'bluetooth', 'pseudo', 'teredo',
]

const CACHE_TTL_MS = 30_000

type CachedNetworkDetails = {
  ip: string
  network: string
  cachedAt: number
}

let networkCache: CachedNetworkDetails | null = null

export type NetworkDetails = {
  ip: string
  network: string
}

export function getNetworkIp(): string {
  const ifaces = os.networkInterfaces()
  let fallbackIp = '127.0.0.1'

  for (const name of Object.keys(ifaces)) {
    if (VIRTUAL_PREFIXES.some(prefix => name.toLowerCase().includes(prefix))) continue

    for (const iface of ifaces[name] || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      if (iface.address.startsWith('192.168.56.')) continue

      if (iface.address.startsWith('192.168.0.') || iface.address.startsWith('192.168.1.')) {
        return iface.address
      }

      fallbackIp = iface.address
    }
  }

  return fallbackIp
}

export function getAllNetworkInterfaces(): { name: string; ip: string }[] {
  const ifaces = os.networkInterfaces()
  const list: { name: string; ip: string }[] = []

  for (const name of Object.keys(ifaces)) {
    if (VIRTUAL_PREFIXES.some((prefix) => name.toLowerCase().includes(prefix))) continue

    for (const iface of ifaces[name] || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      if (iface.address.startsWith('192.168.56.')) continue // VirtualBox fallback ignore
      list.push({ name, ip: iface.address })
    }
  }

  return list
}

function getNetworkInterfaceName(): string {
  const ifaces = os.networkInterfaces()
  let fallbackName = 'Rede Local'

  for (const name of Object.keys(ifaces)) {
    if (VIRTUAL_PREFIXES.some(prefix => name.toLowerCase().includes(prefix))) continue

    for (const iface of ifaces[name] || []) {
      if (iface.family !== 'IPv4' || iface.internal) continue
      if (iface.address.startsWith('192.168.56.')) continue

      if (iface.address.startsWith('192.168.0.') || iface.address.startsWith('192.168.1.')) {
        return name
      }

      fallbackName = name
    }
  }

  return fallbackName
}

function getSSID(): Promise<string | null> {
  return new Promise((resolve) => {
    const safetyTimeout = setTimeout(() => resolve(null), 2500)
    const done = (val: string | null) => {
      clearTimeout(safetyTimeout)
      resolve(val)
    }

    if (process.platform === 'darwin') {
      // Revertendo para usar o binário `airport -I` (caminho conhecido) como antes
      const airportPath = '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport'
      exec(`${airportPath} -I`, { timeout: 1800 }, (err, stdout) => {
        clearTimeout(safetyTimeout)
        if (err || !stdout) return done(null)
        const match = stdout.match(/^\s*SSID:\s*(.+)$/m)
        return done(match ? match[1].trim() : null)
      })
      return
    }

    if (process.platform === 'win32') {
      exec('netsh wlan show interfaces', { timeout: 1800 }, (error, stdout) => {
        if (error || !stdout) return done(null)
        const match = stdout.match(/^\s*SSID\s*:\s*(.+)$/m)
        done(match ? match[1].trim() : null)
      })
      return
    }

    // Linux: tenta nmcli, iwgetid e iw em sequência
    exec('nmcli -t -f active,ssid dev wifi', { timeout: 1800 }, (err, stdout) => {
      if (!err && stdout) {
        // formato: "yes:MinhaRede" ou "sim:MinhaRede" dependendo do locale
        const match = stdout.match(/^(?:yes|sim):(.+)$/im)
        if (match?.[1]?.trim()) return done(match[1].trim())
      }

      exec('iwgetid -r', { timeout: 1800 }, (err2, stdout2) => {
        if (!err2 && stdout2?.trim()) return done(stdout2.trim())

        // iw como último recurso (precisa de permissão em algumas distros)
        exec('iw dev', { timeout: 1800 }, (err3, stdout3) => {
          if (err3 || !stdout3) return done(null)

          const iface = stdout3.match(/Interface\s+(\S+)/)?.[1]
          if (!iface) return done(null)

          exec(`iw ${iface} link`, { timeout: 1800 }, (_err4, stdout4) => {
            const match4 = stdout4?.match(/SSID:\s*(.+)/i)
            done(match4?.[1]?.trim() ?? null)
          })
        })
      })
    })
  })
}

export async function getNetworkDetails(force = false): Promise<NetworkDetails> {
  const now = Date.now()

  if (!force && networkCache && now - networkCache.cachedAt < CACHE_TTL_MS) {
    return networkCache
  }

  const ip = getNetworkIp()
  const ssid = await getSSID()
  const network = ssid ?? getNetworkInterfaceName()

  networkCache = {
    ip,
    network,
    cachedAt: now,
  }

  return networkCache
}

