import type { Team } from '../types'

const BASE = `${import.meta.env.BASE_URL}escudos/`

/** Chave normalizada (minúscula, sem acento, só letras/números) -> arquivo do escudo. */
const SHIELD_FILES: Record<string, string> = {
  valafc: 'vala-fc.png',
  vila: 'vila.png',
  plazafc: 'plaza-fc.png',
  criadoscomvo: 'criados-com-vo.png',
  futcanafc: 'fut_cana-fc.png',
  nacionalfc: 'nacional-fc.png',
  pinheiro: 'pinheiro.png',
  pinheiroatleticoclube: 'pinheiro.png',
  realbets: 'real-bets.png',
}

/** minúsculas, sem acento, só [a-z0-9] — mesma normalização usada nas duas pontas da comparação. */
export function normalizeTeamKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Resolve o escudo de um time: usa a URL já cadastrada quando existe (fonte de verdade),
 * senão tenta casar o nome com os arquivos em public/escudos/ (correspondência exata da
 * chave normalizada e, por fim, contém/é-contido — cobre "PINHEIRO" vs "PINHEIRO ATLÉTICO CLUBE").
 */
export function resolveTeamShield(team: { name: string; shieldUrl?: string | null } | null | undefined): string | null {
  if (!team) return null
  if (team.shieldUrl) return team.shieldUrl

  const key = normalizeTeamKey(team.name)
  if (SHIELD_FILES[key]) return BASE + SHIELD_FILES[key]

  for (const [dictKey, file] of Object.entries(SHIELD_FILES)) {
    if (key.includes(dictKey) || dictKey.includes(key)) return BASE + file
  }
  return null
}

export function resolveTeamShieldByName(name: string, teams: Team[]): string | null {
  const team = teams.find((t) => t.name === name)
  return resolveTeamShield(team ?? { name })
}
