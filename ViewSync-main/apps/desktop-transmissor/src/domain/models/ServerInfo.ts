export type ServerInfo = {
  ip: string
  port: number
  network?: string
  interfaces?: { name: string; ip: string }[]
  adminToken?: string
}
