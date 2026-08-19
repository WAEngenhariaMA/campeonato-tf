export type RankingEntry = {
  teamId: string
  teamName: string
  wonOnPenalties: boolean
  lostOnPenalties: boolean
  goalsFor: number
  goalsAgainst: number
  yellowCards: number
  redCards: number
}

const byStats = (a: RankingEntry, b: RankingEntry) =>
  (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)
  || b.goalsFor - a.goalsFor
  || a.goalsAgainst - b.goalsAgainst
  || a.redCards - b.redCards
  || a.yellowCards - b.yellowCards
  || a.teamName.localeCompare(b.teamName)

/** Vencedores: tempo normal vence desempate com pênaltis; pênaltis nunca alteram gols/saldo. */
export function calculateWinnerRanking(entries: RankingEntry[]) {
  return [...entries].sort((a, b) => Number(a.wonOnPenalties) - Number(b.wonOnPenalties) || byStats(a, b))
}

/** Perdedores: cair nos pênaltis é melhor do que perder no tempo normal. */
export function calculateBestLoser(entries: RankingEntry[]) {
  return [...entries].sort((a, b) => Number(b.lostOnPenalties) - Number(a.lostOnPenalties) || byStats(a, b))[0] ?? null
}

/** Agenda oficial fornecida pela organização; equipes são preenchidas pelo sorteio/cadastro administrativo. */
export const officialSchedule = [
  ['J1', 'PRIMEIRA_FASE', '2026-09-16', '19:45'], ['J2', 'PRIMEIRA_FASE', '2026-09-16', '20:45'], ['J3', 'PRIMEIRA_FASE', '2026-09-16', '21:45'],
  ['J4', 'PRIMEIRA_FASE', '2026-09-18', '19:45'], ['J5', 'PRIMEIRA_FASE', '2026-09-18', '20:45'],
  ['J6', 'PLAYOFF', '2026-09-20', '08:15'], ['J7', 'PLAYOFF', '2026-09-20', '09:15'],
  ['J8', 'SEMIFINAL', '2026-09-25', '19:45'], ['J9', 'SEMIFINAL', '2026-09-25', '20:45'],
  ['J10', 'TERCEIRO_LUGAR', '2026-09-27', '08:15'], ['J11', 'FINAL', '2026-09-27', '09:30'],
] as const
