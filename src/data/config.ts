import { api, poll } from '../lib/api'
import type { ChampionshipConfig } from '../types'


export const DEFAULT_CONFIG: ChampionshipConfig = {
  name: 'COPA COHATRAC TF 2026',
  season: '2026',
  logoUrl: '/copa-cohatrac-tf.jpg',
  sponsors: [],
  registrationsOpen: true,
  playerLimit: 20,
  coachLimit: 2,
  representativeLimit: 2,
  teamCount: 10,
}

export async function ensureConfig(): Promise<ChampionshipConfig> {
  return api<ChampionshipConfig>('/config')
}

export function subscribeConfig(cb: (config: ChampionshipConfig) => void) {
  return poll(ensureConfig, cb)
}

export async function updateConfig(patch: Partial<ChampionshipConfig>) {
  await api<ChampionshipConfig>('/config', { method: 'PATCH', body: JSON.stringify(patch) })
}
