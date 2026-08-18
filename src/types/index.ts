export type Role = 'admin' | 'team'

export type TeamStatus = 'NAO_INICIADO' | 'CADASTRO_INCOMPLETO' | 'COMPLETO' | 'BLOQUEADO'

export interface Team {
  id: string
  name: string
  shortName: string
  shieldUrl: string | null
  login: string
  /** Legado de compatibilidade da interface; a autenticação agora é mantida na API. */
  authUid: string | null
  status: TeamStatus
  /** Seed 1-10, assigned by the official draw. Null until the draw is confirmed. */
  seed: number | null
  primaryColor: string | null
  secondaryColor: string | null
  /** Contadores calculados pela API para a interface. */
  playerCount: number
  coachCount: number
  representativesSubmitted: boolean
  active: boolean
  createdAt: string
}

export type RepresentativeStatus = 'PENDENTE' | 'APROVADO' | 'REJEITADO'

/** One registration per team (doc id === teamId), holding both representatives together. */
export interface RepresentativeRegistration {
  teamId: string
  rep1Name: string
  rep1Phone: string
  rep2Name: string
  rep2Phone: string
  status: RepresentativeStatus
  createdAt: string
}

export interface Player {
  id: string
  teamId: string
  fullName: string
  document: string
  documentNormalized: string
  active: boolean
  createdAt: string
}

export interface Coach {
  id: string
  teamId: string
  fullName: string
  document: string
  documentNormalized: string
  active: boolean
  createdAt: string
}

/** Top-level, cross-team index keyed by normalizedDocument — lets any authenticated
 * team check for a duplicate document without reading another team's roster. */
export interface DocumentIndexEntry {
  documentNormalized: string
  teamId: string
  teamName: string
  playerId: string
  kind: 'player' | 'coach'
}

export type MatchPhase = 'PRIMEIRA_FASE' | 'PLAYOFF' | 'SEMIFINAL' | 'TERCEIRO_LUGAR' | 'FINAL'

export type MatchStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'ENCERRADO' | 'WO' | 'CANCELADO'

export interface Match {
  id: string
  phase: MatchPhase
  /** J1..J11 */
  matchNumber: string
  teamAId: string | null
  teamBId: string | null
  date: string | null
  time: string | null
  goalsA: number
  goalsB: number
  hadPenalties: boolean
  penaltiesA: number | null
  penaltiesB: number | null
  status: MatchStatus
  winnerTeamId: string | null
  createdAt: string
}

export type CardType = 'AMARELO' | 'VERMELHO'
export type CardReason = 'DIRETO' | 'SEGUNDO_AMARELO' | null

export interface Goal {
  id: string
  matchId: string
  teamId: string
  playerId: string
  minute: number
  period: '1T' | '2T' | 'PRORROGACAO'
}

export interface Card {
  id: string
  matchId: string
  teamId: string
  playerId: string
  cardType: CardType
  minute: number
  reason: CardReason
}

export interface MatchReport {
  matchId: string
  observations: string
  finalized: boolean
  finalizedAt: string | null
}

export interface AuditLog {
  id: string
  userId: string
  userLabel: string
  action: string
  entity: string
  entityId: string
  oldValue: unknown
  newValue: unknown
  createdAt: string
}

export type DrawStatus = 'NAO_INICIADO' | 'EM_ANDAMENTO' | 'AGUARDANDO_CONFIRMACAO' | 'FINALIZADO'

export interface Draw {
  id: string
  status: DrawStatus
  startedAt: string | null
  completedAt: string | null
  confirmedAt: string | null
  createdBy: string | null
  soundEnabled: boolean
  countdownEnabled: boolean
  liveMode: boolean
}

export interface DrawPosition {
  position: number
  teamId: string | null
  revealedAt: string | null
  matchNumber: string
}

export interface ChampionshipConfig {
  name: string
  season: string
  logoUrl: string | null
  sponsors: { name: string; logoUrl: string }[]
  registrationsOpen: boolean
  playerLimit: number
  coachLimit: number
  representativeLimit: number
  teamCount: number
}
