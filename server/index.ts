import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { and, asc, eq, or } from 'drizzle-orm'
import { db } from './db/index.js'
import { auditLogs, cards, championshipConfig, coaches, goals, matchReports, matches, players, registeredDocuments, representatives, teams, users } from './db/schema.js'
import { calculateBestLoser, calculateWinnerRanking, officialSchedule, type RankingEntry } from './tournament.js'

dotenv.config({ path: '.env.local' })

type Claims = { sub: string; role: 'admin' | 'team'; teamId: string | null }
type AuthedRequest = Request & { auth?: Claims }
const app = express()
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') ?? true }))
app.use(express.json())

const configDefault = { id: 1, name: 'COPA COHATRAC TF 2026', season: '2026', logoUrl: '/copa-cohatrac-tf.jpg', sponsors: [], registrationsOpen: true, playerLimit: 20, coachLimit: 2, representativeLimit: 2, teamCount: 10 }
const tokenFor = (claims: Claims) => jwt.sign(claims, process.env.JWT_SECRET!, { expiresIn: '12h' })
const fail = (res: Response, status: number, message: string) => res.status(status).json({ message })
const auth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const raw = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!raw) return fail(res, 401, 'Autenticação necessária.')
  try { req.auth = jwt.verify(raw, process.env.JWT_SECRET!) as Claims; next() } catch { return fail(res, 401, 'Sessão expirada. Entre novamente.') }
}
const admin = (req: AuthedRequest, res: Response, next: NextFunction) => req.auth?.role === 'admin' ? next() : fail(res, 403, 'Acesso administrativo necessário.')
const ownTeam = (req: AuthedRequest, res: Response, teamId: string) => req.auth?.role === 'admin' || req.auth?.teamId === teamId
const normalizeName = (value: string) => value.trim().replace(/\s+/g, ' ').toUpperCase()
const normalizeDocument = (value: string) => value.replace(/\D/g, '')
const param = (req: Request, key: string) => String(req.params[key])

async function getConfig() {
  const [config] = await db.select().from(championshipConfig).where(eq(championshipConfig.id, 1))
  if (config) return config
  const [created] = await db.insert(championshipConfig).values(configDefault).returning()
  return created
}
async function serializeTeam(team: typeof teams.$inferSelect) {
  const [playerCount] = await db.select().from(players).where(and(eq(players.teamId, team.id), eq(players.active, true)))
  const [coachCount] = await db.select().from(coaches).where(and(eq(coaches.teamId, team.id), eq(coaches.active, true)))
  return { ...team, authUid: null, playerCount: playerCount ? (await db.select().from(players).where(and(eq(players.teamId, team.id), eq(players.active, true)))).length : 0, coachCount: coachCount ? (await db.select().from(coaches).where(and(eq(coaches.teamId, team.id), eq(coaches.active, true)))).length : 0, createdAt: team.createdAt.toISOString() }
}
async function teamList() { return Promise.all((await db.select().from(teams).orderBy(asc(teams.name))).map(serializeTeam)) }

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.get('/api/config', async (_req, res) => res.json(await getConfig()))
app.patch('/api/config', auth, admin, async (req, res) => {
  await getConfig(); const [updated] = await db.update(championshipConfig).set(req.body).where(eq(championshipConfig.id, 1)).returning(); res.json(updated)
})
app.get('/api/teams', async (_req, res) => res.json(await teamList()))
app.get('/api/teams/:id', auth, async (req: AuthedRequest, res) => {
  const id = param(req, 'id'); if (!ownTeam(req, res, id)) return fail(res, 403, 'Sem acesso a este time.')
  const [team] = await db.select().from(teams).where(eq(teams.id, id)); if (!team) return fail(res, 404, 'Time não encontrado.'); res.json(await serializeTeam(team))
})
app.post('/api/teams', auth, admin, async (req, res) => {
  const { name, shortName, login, password } = req.body
  if (!name || !shortName || !login || !password) return fail(res, 400, 'Preencha nome, sigla, login e senha.')
  try {
    const result = await db.transaction(async (tx) => {
      const [team] = await tx.insert(teams).values({ name: normalizeName(name), shortName: normalizeName(shortName), login: login.trim().toLowerCase() }).returning()
      await tx.insert(users).values({ username: team.login, passwordHash: await bcrypt.hash(password, 12), role: 'team', teamId: team.id })
      return team
    }); res.status(201).json(await serializeTeam(result))
  } catch { return fail(res, 409, 'Esse login já está em uso.') }
})
app.patch('/api/teams/:id', auth, admin, async (req, res) => {
  const id = param(req, 'id')
  const { name, shortName, login, active, shieldUrl, seed, primaryColor, secondaryColor } = req.body
  const patch: Record<string, unknown> = {}
  if (typeof name === 'string') patch.name = normalizeName(name)
  if (typeof shortName === 'string') patch.shortName = normalizeName(shortName)
  if (typeof login === 'string' && login.trim()) patch.login = login.trim().toLowerCase()
  if (typeof active === 'boolean') patch.active = active
  if (shieldUrl === null || typeof shieldUrl === 'string') patch.shieldUrl = shieldUrl
  if (seed === null || typeof seed === 'number') patch.seed = seed
  if (primaryColor === null || typeof primaryColor === 'string') patch.primaryColor = primaryColor
  if (secondaryColor === null || typeof secondaryColor === 'string') patch.secondaryColor = secondaryColor
  try {
    const updated = await db.transaction(async (tx) => {
      const [team] = await tx.update(teams).set(patch).where(eq(teams.id, id)).returning()
      if (!team) return null
      if (typeof patch.login === 'string') await tx.update(users).set({ username: patch.login }).where(eq(users.teamId, id))
      return team
    })
    if (!updated) return fail(res, 404, 'Time não encontrado.')
    res.json(await serializeTeam(updated))
  } catch { return fail(res, 409, 'Esse login já está em uso.') }
})
app.post('/api/teams/:id/password', auth, admin, async (req, res) => {
  const password = String(req.body.password ?? '')
  if (password.length < 6) return fail(res, 400, 'A senha deve ter pelo menos 6 caracteres.')
  const id = param(req, 'id')
  const [account] = await db.select().from(users).where(eq(users.teamId, id))
  if (!account) return fail(res, 404, 'Conta do time não encontrada.')
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 12) }).where(eq(users.id, account.id))
  res.status(204).end()
})
app.delete('/api/teams/:id', auth, admin, async (req, res) => {
  const id = param(req, 'id')
  await db.transaction(async (tx) => {
    await tx.delete(registeredDocuments).where(eq(registeredDocuments.teamId, id))
    await tx.delete(players).where(eq(players.teamId, id))
    await tx.delete(coaches).where(eq(coaches.teamId, id))
    await tx.delete(representatives).where(eq(representatives.teamId, id))
    await tx.delete(users).where(eq(users.teamId, id))
    await tx.delete(teams).where(eq(teams.id, id))
  })
  res.status(204).end()
})

app.post('/api/auth/login', async (req, res) => {
  const { login, password, admin: isAdmin } = req.body
  const username = String(login).trim().toLowerCase()
  const [user] = await db.select().from(users).where(eq(users.username, username)); if (!user || !(await bcrypt.compare(password, user.passwordHash))) return fail(res, 401, 'Login ou senha inválidos.')
  if (isAdmin && user.role !== 'admin') return fail(res, 403, 'Esta conta não é administradora.')
  if (!isAdmin && user.role !== 'team') return fail(res, 403, 'Use o acesso administrativo.')
  const claims: Claims = { sub: user.id, role: user.role, teamId: user.teamId }; res.json({ token: tokenFor(claims), ...claims })
})
app.get('/api/auth/me', auth, async (req: AuthedRequest, res) => { const team = req.auth?.teamId ? (await db.select().from(teams).where(eq(teams.id, req.auth.teamId)))[0] : null; res.json({ ...req.auth, team: team ? await serializeTeam(team) : null }) })
app.post('/api/auth/password', auth, async (req: AuthedRequest, res) => { const { currentPassword, newPassword } = req.body; const [user] = await db.select().from(users).where(eq(users.id, req.auth!.sub)); if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return fail(res, 400, 'Senha atual inválida.'); await db.update(users).set({ passwordHash: await bcrypt.hash(newPassword, 12) }).where(eq(users.id, user.id)); res.status(204).end() })

async function listRoster(table: typeof players, teamId?: string): Promise<(typeof players.$inferSelect)[]> 
async function listRoster(table: typeof coaches, teamId?: string): Promise<(typeof coaches.$inferSelect)[]>
async function listRoster(table: typeof players | typeof coaches, teamId?: string) { const tableAny = table as any; const condition = teamId ? and(eq(tableAny.teamId, teamId), eq(tableAny.active, true)) : eq(tableAny.active, true); return db.select().from(tableAny).where(condition).orderBy(asc(tableAny.fullName)) }
app.get('/api/players', auth, async (req: AuthedRequest, res) => res.json(await listRoster(players, req.auth?.role === 'team' ? req.auth.teamId! : undefined)))
app.get('/api/coaches', auth, async (req: AuthedRequest, res) => res.json(await listRoster(coaches, req.auth?.role === 'team' ? req.auth.teamId! : undefined)))
function rosterRoutes(kind: 'player' | 'coach', table: typeof players | typeof coaches) {
  const tableAny = table as any
  const resource = kind === 'coach' ? 'coaches' : 'players'
  app.post(`/api/${resource}`, auth, async (req: AuthedRequest, res) => {
    const { teamId, fullName, document, limit } = req.body; if (!ownTeam(req, res, teamId)) return fail(res, 403, 'Sem acesso a este time.')
    if (typeof teamId !== 'string' || typeof fullName !== 'string' || typeof document !== 'string' || !Number.isInteger(limit) || limit < 1) return fail(res, 400, 'Dados do cadastro inválidos.')
    const normalized = normalizeDocument(document); if (!normalized) return fail(res, 400, 'Documento é obrigatório.')
    try { const item = await db.transaction(async (tx) => { const active = await tx.select().from(tableAny).where(and(eq(tableAny.teamId, teamId), eq(tableAny.active, true))); if (active.length >= limit) throw new Error('LIMIT'); const [created] = await tx.insert(tableAny).values({ teamId, fullName: normalizeName(fullName), document: String(document).trim(), documentNormalized: normalized }).returning(); await tx.insert(registeredDocuments).values({ documentNormalized: normalized, teamId, kind, recordId: created.id }); return created }); res.status(201).json(item) } catch (error) { return fail(res, 409, error instanceof Error && error.message === 'LIMIT' ? `LIMITE DE ${limit} ATINGIDO.` : 'Este documento já está cadastrado.') }
  })
  app.patch(`/api/${resource}/:id`, auth, async (req: AuthedRequest, res) => { const [item] = await db.select().from(tableAny).where(eq(tableAny.id, param(req, 'id'))); if (!item) return fail(res, 404, 'Registro não encontrado.'); if (!ownTeam(req, res, item.teamId)) return fail(res, 403, 'Sem acesso.'); const [updated] = await db.update(tableAny).set({ fullName: normalizeName(req.body.fullName) }).where(eq(tableAny.id, item.id)).returning(); res.json(updated) })
  app.delete(`/api/${resource}/:id`, auth, async (req: AuthedRequest, res) => { const [item] = await db.select().from(tableAny).where(eq(tableAny.id, param(req, 'id'))); if (!item) return fail(res, 404, 'Registro não encontrado.'); if (!ownTeam(req, res, item.teamId)) return fail(res, 403, 'Sem acesso.'); await db.transaction(async (tx) => { await tx.update(tableAny).set({ active: false }).where(eq(tableAny.id, item.id)); await tx.delete(registeredDocuments).where(eq(registeredDocuments.documentNormalized, item.documentNormalized)) }); res.status(204).end() })
}
rosterRoutes('player', players); rosterRoutes('coach', coaches)

app.get('/api/representatives', auth, admin, async (_req, res) => res.json(await db.select().from(representatives)))
app.get('/api/representatives/:teamId', auth, async (req: AuthedRequest, res) => { const teamId = param(req, 'teamId'); if (!ownTeam(req, res, teamId)) return fail(res, 403, 'Sem acesso.'); const [registration] = await db.select().from(representatives).where(eq(representatives.teamId, teamId)); res.json(registration ?? null) })
app.post('/api/representatives', async (req, res) => { const input = req.body; try { const result = await db.transaction(async (tx) => { const [registration] = await tx.insert(representatives).values({ teamId: input.teamId, rep1Name: normalizeName(input.rep1Name), rep1Phone: input.rep1Phone, rep2Name: normalizeName(input.rep2Name), rep2Phone: input.rep2Phone }).returning(); await tx.update(teams).set({ representativesSubmitted: true }).where(eq(teams.id, input.teamId)); return registration }); res.status(201).json(result) } catch { return fail(res, 409, 'Este time já enviou o cadastro.') } })
app.patch('/api/representatives/:teamId', auth, admin, async (req, res) => { const [updated] = await db.update(representatives).set(req.body).where(eq(representatives.teamId, param(req, 'teamId'))).returning(); if (!updated) return fail(res, 404, 'Cadastro não encontrado.'); res.json(updated) })
app.delete('/api/representatives/:teamId', auth, admin, async (req, res) => { const teamId = param(req, 'teamId'); await db.transaction(async (tx) => { await tx.delete(representatives).where(eq(representatives.teamId, teamId)); await tx.update(teams).set({ representativesSubmitted: false }).where(eq(teams.id, teamId)) }); res.status(204).end() })
app.post('/api/audit-logs', auth, async (req, res) => { const [entry] = await db.insert(auditLogs).values(req.body).returning(); res.status(201).json(entry) })

app.get('/api/matches', auth, async (req: AuthedRequest, res) => {
  const where = req.auth?.role === 'team' ? or(eq(matches.teamAId, req.auth.teamId!), eq(matches.teamBId, req.auth.teamId!)) : undefined
  res.json(await db.select().from(matches).where(where).orderBy(asc(matches.matchNumber)))
})
app.post('/api/matches/schedule', auth, admin, async (_req, res) => {
  await db.transaction(async (tx) => {
    for (const [matchNumber, phase, matchDate, matchTime] of officialSchedule) {
      await tx.insert(matches).values({ matchNumber, phase, matchDate, matchTime }).onConflictDoNothing()
    }
  })
  res.status(201).json(await db.select().from(matches).orderBy(asc(matches.matchNumber)))
})
app.patch('/api/matches/:id', auth, admin, async (req, res) => {
  const id = param(req, 'id')
  const { teamAId, teamBId, matchDate, matchTime, goalsA, goalsB, hadPenalties, penaltiesA, penaltiesB, status } = req.body
  const [existing] = await db.select().from(matches).where(eq(matches.id, id))
  if (!existing) return fail(res, 404, 'Partida não encontrada.')
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries({ teamAId, teamBId, matchDate, matchTime, goalsA, goalsB, hadPenalties, penaltiesA, penaltiesB, status })) if (value !== undefined) patch[key] = value
  if (status === 'ENCERRADO' || status === 'WO') {
    const home = teamAId ?? existing.teamAId; const away = teamBId ?? existing.teamBId; const scoreA = goalsA ?? existing.goalsA; const scoreB = goalsB ?? existing.goalsB
    const penaltiesUsed = hadPenalties ?? existing.hadPenalties; const penaltyA = penaltiesA ?? existing.penaltiesA; const penaltyB = penaltiesB ?? existing.penaltiesB
    if (!home || !away) return fail(res, 400, 'Defina os dois times antes de encerrar a partida.')
    const tied = scoreA === scoreB
    if (tied && (!penaltiesUsed || penaltyA === penaltyB || penaltyA == null || penaltyB == null)) return fail(res, 400, 'Empate eliminatório exige pênaltis com vencedor definido.')
    patch.winnerTeamId = scoreA > scoreB || (tied && penaltyA! > penaltyB!) ? home : away
  }
  const [updated] = await db.update(matches).set(patch).where(eq(matches.id, id)).returning()
  res.json(updated)
})
app.get('/api/matches/:id/report', auth, async (req: AuthedRequest, res) => {
  const id = param(req, 'id'); const [match] = await db.select().from(matches).where(eq(matches.id, id)); if (!match) return fail(res, 404, 'Partida não encontrada.')
  if (!ownTeam(req, res, match.teamAId ?? '') && !ownTeam(req, res, match.teamBId ?? '')) return fail(res, 403, 'Sem acesso a esta partida.')
  const [report] = await db.select().from(matchReports).where(eq(matchReports.matchId, id))
  res.json({ match, report: report ?? null, goals: await db.select().from(goals).where(eq(goals.matchId, id)), cards: await db.select().from(cards).where(eq(cards.matchId, id)) })
})
async function eventMatch(id: string) { return (await db.select().from(matches).where(eq(matches.id, id)))[0] }
async function validateMatchPlayer(matchId: string, teamId: string, playerId: string) {
  const match = await eventMatch(matchId); if (!match) throw new Error('Partida não encontrada.')
  if (teamId !== match.teamAId && teamId !== match.teamBId) throw new Error('O time não participa desta partida.')
  const [player] = await db.select().from(players).where(and(eq(players.id, playerId), eq(players.teamId, teamId), eq(players.active, true)))
  if (!player) throw new Error('Jogador inválido para este time.')
  return match
}
async function recalculateScore(matchId: string) {
  const match = await eventMatch(matchId); if (!match) return
  const events = await db.select().from(goals).where(eq(goals.matchId, matchId))
  await db.update(matches).set({ goalsA: events.filter((goal) => goal.teamId === match.teamAId).length, goalsB: events.filter((goal) => goal.teamId === match.teamBId).length }).where(eq(matches.id, matchId))
}
app.post('/api/goals', auth, admin, async (req, res) => {
  const { matchId, teamId, playerId, minute, period } = req.body
  try { await validateMatchPlayer(matchId, teamId, playerId); if (!Number.isInteger(minute) || minute < 0 || minute > 150) return fail(res, 400, 'Minuto inválido.'); const [created] = await db.insert(goals).values({ matchId, teamId, playerId, minute, period }).returning(); await recalculateScore(matchId); res.status(201).json(created) } catch (error) { return fail(res, 400, error instanceof Error ? error.message : 'Não foi possível registrar o gol.') }
})
app.patch('/api/goals/:id', auth, admin, async (req, res) => {
  const id = param(req, 'id'); const [current] = await db.select().from(goals).where(eq(goals.id, id)); if (!current) return fail(res, 404, 'Gol não encontrado.')
  const { teamId = current.teamId, playerId = current.playerId, minute = current.minute, period = current.period } = req.body
  try { await validateMatchPlayer(current.matchId, teamId, playerId); const [updated] = await db.update(goals).set({ teamId, playerId, minute, period }).where(eq(goals.id, id)).returning(); await recalculateScore(current.matchId); res.json(updated) } catch (error) { return fail(res, 400, error instanceof Error ? error.message : 'Não foi possível atualizar o gol.') }
})
app.delete('/api/goals/:id', auth, admin, async (req, res) => { const id = param(req, 'id'); const [current] = await db.select().from(goals).where(eq(goals.id, id)); if (!current) return fail(res, 404, 'Gol não encontrado.'); await db.delete(goals).where(eq(goals.id, id)); await recalculateScore(current.matchId); res.status(204).end() })
app.post('/api/cards', auth, admin, async (req, res) => {
  const { matchId, teamId, playerId, cardType, minute, reason = null, suspensionMatches = 0 } = req.body
  try { await validateMatchPlayer(matchId, teamId, playerId); if (!['AMARELO', 'VERMELHO'].includes(cardType) || !Number.isInteger(minute) || minute < 0 || minute > 150) return fail(res, 400, 'Dados do cartão inválidos.'); const [created] = await db.insert(cards).values({ matchId, teamId, playerId, cardType, minute, reason, suspensionMatches }).returning(); res.status(201).json(created) } catch (error) { return fail(res, 400, error instanceof Error ? error.message : 'Não foi possível registrar o cartão.') }
})
app.patch('/api/cards/:id', auth, admin, async (req, res) => { const id = param(req, 'id'); const [current] = await db.select().from(cards).where(eq(cards.id, id)); if (!current) return fail(res, 404, 'Cartão não encontrado.'); const { minute = current.minute, reason = current.reason, suspensionMatches = current.suspensionMatches } = req.body; const [updated] = await db.update(cards).set({ minute, reason, suspensionMatches }).where(eq(cards.id, id)).returning(); res.json(updated) })
app.delete('/api/cards/:id', auth, admin, async (req, res) => { const id = param(req, 'id'); await db.delete(cards).where(eq(cards.id, id)); res.status(204).end() })
app.delete('/api/matches/:id/result', auth, admin, async (req, res) => { const id = param(req, 'id'); await db.transaction(async (tx) => { await tx.delete(goals).where(eq(goals.matchId, id)); await tx.delete(cards).where(eq(cards.matchId, id)); await tx.update(matches).set({ goalsA: 0, goalsB: 0, hadPenalties: false, penaltiesA: null, penaltiesB: null, winnerTeamId: null, status: 'NAO_INICIADO' }).where(eq(matches.id, id)) }); res.status(204).end() })

type Standing = { position: number; teamId: string; teamName: string; games: number; wins: number; losses: number; goalsFor: number; goalsAgainst: number; goalDifference: number; yellowCards: number; redCards: number; situation: string }
async function tournamentSnapshot() {
  const allTeams = await db.select().from(teams).orderBy(asc(teams.name))
  const allMatches = await db.select().from(matches).orderBy(asc(matches.matchNumber))
  const allCards = await db.select().from(cards)
  const allGoals = await db.select().from(goals)
  const allPlayers = await db.select().from(players)
  const playerName = new Map(allPlayers.map((player) => [player.id, player.fullName]))
  const teamName = new Map(allTeams.map((team) => [team.id, team.name]))
  const values = new Map(allTeams.map((team) => [team.id, { team, games: 0, wins: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, yellowCards: 0, redCards: 0 }]))
  for (const card of allCards) { const entry = values.get(card.teamId); if (entry) { if (card.cardType === 'AMARELO') entry.yellowCards++; else entry.redCards++ } }
  const completedFirst = allMatches.filter((match) => match.phase === 'PRIMEIRA_FASE' && (match.status === 'ENCERRADO' || match.status === 'WO') && match.teamAId && match.teamBId)
  for (const match of completedFirst) {
    const a = values.get(match.teamAId!), b = values.get(match.teamBId!); if (!a || !b) continue
    a.games++; b.games++; a.goalsFor += match.goalsA; a.goalsAgainst += match.goalsB; b.goalsFor += match.goalsB; b.goalsAgainst += match.goalsA
    if (match.winnerTeamId === a.team.id) { a.wins++; b.losses++ } else if (match.winnerTeamId === b.team.id) { b.wins++; a.losses++ }
  }
  const rankingInput: RankingEntry[] = completedFirst.flatMap((match) => [match.teamAId, match.teamBId].map((teamId) => {
    const item = values.get(teamId!)!
    return { teamId: item.team.id, teamName: item.team.name, goalsFor: item.goalsFor, goalsAgainst: item.goalsAgainst, yellowCards: item.yellowCards, redCards: item.redCards, wonOnPenalties: match.winnerTeamId === item.team.id && match.hadPenalties, lostOnPenalties: match.winnerTeamId !== item.team.id && match.hadPenalties }
  }))
  const winners = calculateWinnerRanking(rankingInput.filter((entry) => completedFirst.some((match) => match.winnerTeamId === entry.teamId)))
  const losers = rankingInput.filter((entry) => completedFirst.some((match) => match.teamAId === entry.teamId || match.teamBId === entry.teamId) && !winners.some((winner) => winner.teamId === entry.teamId))
  const bestLoser = calculateBestLoser(losers)
  const situation = new Map<string, string>()
  if (completedFirst.length === 5) { winners.forEach((winner, index) => situation.set(winner.teamId, index < 2 ? 'SEMIFINAL' : 'PLAYOFF')); if (bestLoser) situation.set(bestLoser.teamId, 'MELHOR PERDEDOR'); for (const entry of losers) if (entry.teamId !== bestLoser?.teamId) situation.set(entry.teamId, 'ELIMINADO') }
  const standings: Standing[] = [...values.values()].map((item) => ({ teamId: item.team.id, teamName: item.team.name, games: item.games, wins: item.wins, losses: item.losses, goalsFor: item.goalsFor, goalsAgainst: item.goalsAgainst, goalDifference: item.goalsFor - item.goalsAgainst, yellowCards: item.yellowCards, redCards: item.redCards, situation: situation.get(item.team.id) ?? (completedFirst.length === 5 ? 'ELIMINADO' : 'EM DISPUTA') })).sort((a, b) => b.wins - a.wins || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.goalsAgainst - b.goalsAgainst || a.redCards - b.redCards || a.yellowCards - b.yellowCards || a.teamName.localeCompare(b.teamName)).map((entry, index) => ({ ...entry, position: index + 1 }))
  const disciplinary = [...new Map(allPlayers.map((player) => [player.id, player])).values()].map((player) => {
    const playerCards = allCards.filter((card) => card.playerId === player.id)
    const yellowCards = playerCards.filter((card) => card.cardType === 'AMARELO').length
    const suspensionMatches = playerCards.filter((card) => card.cardType === 'VERMELHO').reduce((total, card) => total + card.suspensionMatches, 0)
    return { playerId: player.id, playerName: player.fullName, teamId: player.teamId, teamName: teamName.get(player.teamId) ?? '', yellowCards, redCards: playerCards.filter((card) => card.cardType === 'VERMELHO').length, suspensionMatches }
  }).filter((player) => player.suspensionMatches > 0 || player.yellowCards >= 2)
  const history = allMatches.filter((match) => match.status === 'ENCERRADO' || match.status === 'WO').map((match) => ({ matchId: match.id, goals: allGoals.filter((goal) => goal.matchId === match.id).map((goal) => ({ ...goal, playerName: playerName.get(goal.playerId) ?? 'Jogador', teamName: teamName.get(goal.teamId) ?? '' })), cards: allCards.filter((card) => card.matchId === match.id).map((card) => ({ ...card, playerName: playerName.get(card.playerId) ?? 'Jogador', teamName: teamName.get(card.teamId) ?? '' })) }))
  return { matches: allMatches, standings, firstPhaseFinished: completedFirst.length === 5, disciplinary, history }
}
app.get('/api/tournament', async (_req, res) => res.json(await tournamentSnapshot()))
app.get('/api/standings', auth, async (_req, res) => res.json((await tournamentSnapshot()).standings))

async function seedAdmin() { if (!process.env.ADMIN_LOGIN || !process.env.ADMIN_PASSWORD) return; const username = process.env.ADMIN_LOGIN.trim().toLowerCase(); const exists = await db.select().from(users).where(eq(users.username, username)); if (!exists.length) await db.insert(users).values({ username, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin' }) }
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não foi configurada.')
await seedAdmin(); app.listen(Number(process.env.PORT ?? 3001), () => console.log('API em http://localhost:3001'))
