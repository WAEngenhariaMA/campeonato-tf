import { listAllPlayers } from './players'
import { nameSimilarity, POSSIBLE_DUPLICATE_THRESHOLD } from '../lib/normalize'
import type { Player, Team } from '../types'

export interface DuplicateAlert {
  id: string
  level: 'CRITICO' | 'POSSIVEL'
  reason: string
  playerA: Player
  teamAName: string
  playerB: Player
  teamBName: string
}

/**
 * Document-exact duplicates can't actually occur — addPlayer's transaction blocks them
 * at write time — so this only ever surfaces name-similarity alerts today. Kept as a
 * scan (not a live index) since legacy/imported data could reintroduce exact matches later.
 */
export function findDuplicateAlerts(players: Player[], teamsById: Map<string, Team>): DuplicateAlert[] {
  const alerts: DuplicateAlert[] = []

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i]
      const b = players[j]
      if (a.teamId === b.teamId && a.fullName === b.fullName) continue

      if (a.documentNormalized === b.documentNormalized) {
        alerts.push({
          id: `${a.id}-${b.id}`,
          level: 'CRITICO',
          reason: 'Mesmo documento cadastrado em times diferentes.',
          playerA: a,
          teamAName: teamsById.get(a.teamId)?.name ?? a.teamId,
          playerB: b,
          teamBName: teamsById.get(b.teamId)?.name ?? b.teamId,
        })
        continue
      }

      const score = nameSimilarity(a.fullName, b.fullName)
      if (score >= POSSIBLE_DUPLICATE_THRESHOLD) {
        alerts.push({
          id: `${a.id}-${b.id}`,
          level: 'POSSIVEL',
          reason: `Nomes semelhantes (similaridade ${(score * 100).toFixed(0)}%).`,
          playerA: a,
          teamAName: teamsById.get(a.teamId)?.name ?? a.teamId,
          playerB: b,
          teamBName: teamsById.get(b.teamId)?.name ?? b.teamId,
        })
      }
    }
  }

  return alerts.sort((a, b) => (a.level === b.level ? 0 : a.level === 'CRITICO' ? -1 : 1))
}

export async function computeDuplicateAlerts(teamsById: Map<string, Team>): Promise<DuplicateAlert[]> {
  const players = await listAllPlayers()
  return findDuplicateAlerts(players, teamsById)
}
