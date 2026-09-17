export type RankingEntry = {
  teamId: string
  teamName: string
  wonOnPenalties: boolean
  lostOnPenalties: boolean
  goalsFor: number
  goalsAgainst: number
  redCards: number
  yellowCards: number
  fouls: number
}

/**
 * Critérios oficiais de desempate (2º ao 7º da tabela — o 1º e o 8º dependem de vitória/derrota
 * e são aplicados por calculateWinnerRanking/calculateLoserRanking; pênaltis nunca entram aqui).
 */
const byStats = (a: RankingEntry, b: RankingEntry) =>
  (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) // 2º maior saldo de gols
  || b.goalsFor - a.goalsFor // 3º maior número de gols marcados
  || a.goalsAgainst - b.goalsAgainst // 4º menor número de gols sofridos
  || a.redCards - b.redCards // 5º menor número de cartões vermelhos
  || a.yellowCards - b.yellowCards // 6º menor número de cartões amarelos
  || a.fouls - b.fouls // 7º menor número de faltas
  || a.teamName.localeCompare(b.teamName) // 8º sorteio da organização (aplicado manualmente em empate absoluto)

/** Vencedores: 1º vitória no tempo normal > vitória nos pênaltis; pênaltis nunca alteram gols/saldo. */
export function calculateWinnerRanking(entries: RankingEntry[]) {
  return [...entries].sort((a, b) => Number(a.wonOnPenalties) - Number(b.wonOnPenalties) || byStats(a, b))
}

/** Perdedores: 1º cair nos pênaltis é melhor do que perder no tempo normal. Mesma regra da classificação geral. */
export function calculateLoserRanking(entries: RankingEntry[]) {
  return [...entries].sort((a, b) => Number(b.lostOnPenalties) - Number(a.lostOnPenalties) || byStats(a, b))
}

/**
 * Agenda oficial fornecida pela organização; equipes são preenchidas pelo sorteio/cadastro
 * administrativo. J6 é o confronto Cajueiro FC x Trevo: seu vencedor ocupa a 4ª vaga do playoff
 * no lugar do antigo "melhor perdedor" (ver tournamentSnapshot em server/index.ts).
 */
export const officialSchedule = [
  ['J1', 'PRIMEIRA_FASE', '2026-09-16', '19:45'], ['J2', 'PRIMEIRA_FASE', '2026-09-16', '20:45'], ['J3', 'PRIMEIRA_FASE', '2026-09-16', '21:45'],
  ['J4', 'PRIMEIRA_FASE', '2026-09-18', '19:45'], ['J5', 'PRIMEIRA_FASE', '2026-09-18', '20:45'], ['J6', 'PRIMEIRA_FASE', null, null],
  ['J7', 'PLAYOFF', '2026-09-20', '08:15'], ['J8', 'PLAYOFF', '2026-09-20', '09:15'],
  ['J9', 'SEMIFINAL', '2026-09-25', '19:45'], ['J10', 'SEMIFINAL', '2026-09-25', '20:45'],
  ['J11', 'TERCEIRO_LUGAR', '2026-09-27', '08:15'], ['J12', 'FINAL', '2026-09-27', '09:30'],
] as const
