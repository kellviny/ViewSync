// Configurações que o transmissor define
export interface StreamConfig {
  fps: 30 | 60;
  hasPassword: boolean;
  producerId?: string;
}

// O estado atual da sala que o servidor transmite
export interface RoomState {
  isStreaming: boolean;
  connectedCount: number;
  activeViewersCount: number;
  config: StreamConfig | null;
}

// Eventos de Sinalização mediasoup
export interface MediasoupEvents {
  "mediasoup:getRouterRtpCapabilities": (callback: (rtpCapabilities: any) => void) => void;
  "mediasoup:createWebRtcTransport": (payload: { direction: 'send' | 'recv' }, callback: (params: any) => void) => void;
  "mediasoup:connectWebRtcTransport": (payload: { transportId: string, dtlsParameters: any }, callback: () => void) => void;
  "mediasoup:produce": (payload: { transportId: string, kind: string, rtpParameters: any }, callback: (data: { id: string }) => void) => void;
  "mediasoup:consume": (payload: { transportId: string, producerId: string, rtpCapabilities: any }, callback: (data: any) => void) => void;
  "mediasoup:resume": (payload: { transportId: string, consumerId: string }, callback: () => void) => void;
}

// Eventos que o Cliente (Transmissor ou Espectador) envia para o Servidor
export interface ClientToServerEvents extends MediasoupEvents {
  "host:start_stream": (payload: { config: StreamConfig, password?: string }) => void;
  "host:stop_stream": () => void;
  "host:frame"?: (frameData: string) => void; // Legado para fallback se necessário
  "viewer:join": (payload: { password?: string }) => void;
  "viewer:visibility_change": (isVisible: boolean) => void;
}

// Eventos que o Servidor envia para os Clientes
export interface ServerToClientEvents {
  "room:state_update": (state: RoomState & { hostId: string | null }) => void;
  "room:frame"?: (frameData: string) => void; // Legado
  "mediasoup:newProducer": (payload: { producerId: string }) => void;
  "error": (message: string) => void;
  "server:info": (data: { ip: string, network: string, port: number }) => void;
  "viewer:authorized": () => void;
}

// ── Validações Centralizadas ──
export const ENROLLMENT_PATTERN = /^(\d{4})(\d{3})([A-Z]{4})(\d{4})$/
export const SUSPICIOUS_NAME_PATTERN = /\b(teste|test|asdf|qwerty|admin|usuario|nome|zoado)\b/i

export const normalizeName = (input: string): string => input.replace(/\s+/g, ' ').trim()

export const validateEnrollment = (input: string): string | null => {
  const value = input.trim().toUpperCase()
  const match = value.match(ENROLLMENT_PATTERN)

  if (!match) {
    return 'Matrícula inválida. Use o padrão AAAA999LLLL9999'
  }

  const enrollmentYear = Number(match[1])
  const currentYear = new Date().getFullYear()

  if (enrollmentYear > currentYear || enrollmentYear < 1900) {
    return 'Ano da matrícula inválido.'
  }

  return null
}

export const validateName = (input: string): string | null => {
  const value = normalizeName(input)

  if (value.length < 3) {
    return 'Nome deve ter pelo menos 3 caracteres'
  }

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/.test(value)) {
    return 'Nome inválido. Use apenas letras e espaços'
  }

  if (!/[AEIOUaeiouÀ-ÖØ-öø-ÿ]/.test(value) || /(.)\1{3,}/.test(value)) {
    return 'Nome inválido. Informe um nome real'
  }

  if (SUSPICIOUS_NAME_PATTERN.test(value)) {
    return 'Nome inválido. Informe seu nome real'
  }

  return null
}