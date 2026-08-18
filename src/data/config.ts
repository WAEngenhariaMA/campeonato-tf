import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ChampionshipConfig } from '../types'

const CONFIG_DOC = doc(db, 'config', 'championship')

export const DEFAULT_CONFIG: ChampionshipConfig = {
  name: 'CAMPEONATO 2026',
  season: '2026',
  logoUrl: null,
  sponsors: [],
  registrationsOpen: true,
  playerLimit: 20,
  coachLimit: 2,
  representativeLimit: 2,
  teamCount: 10,
}

export async function ensureConfig(): Promise<ChampionshipConfig> {
  const snap = await getDoc(CONFIG_DOC)
  if (!snap.exists()) {
    await setDoc(CONFIG_DOC, DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }
  return snap.data() as ChampionshipConfig
}

export function subscribeConfig(cb: (config: ChampionshipConfig) => void) {
  return onSnapshot(CONFIG_DOC, (snap) => {
    cb(snap.exists() ? (snap.data() as ChampionshipConfig) : DEFAULT_CONFIG)
  })
}

export async function updateConfig(patch: Partial<ChampionshipConfig>) {
  await updateDoc(CONFIG_DOC, patch)
}
