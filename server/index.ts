import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import { and, asc, eq } from 'drizzle-orm'
import { db } from './db/index.js'
import { auditLogs, championshipConfig, coaches, players, registeredDocuments, representatives, teams, users } from './db/schema.js'

dotenv.config({ path: '.env.local' })

type Claims = { sub: string; role: 'admin' | 'team'; teamId: string | null }
type AuthedRequest = Request & { auth?: Claims }
const app = express()
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') ?? true }))
app.use(express.json())

const configDefault = { id: 1, name: 'CAMPEONATO 2026', season: '2026', logoUrl: null, sponsors: [], registrationsOpen: true, playerLimit: 20, coachLimit: 2, representativeLimit: 2, teamCount: 10 }
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
  app.post(`/api/${kind}s`, auth, async (req: AuthedRequest, res) => {
    const { teamId, fullName, document, limit } = req.body; if (!ownTeam(req, res, teamId)) return fail(res, 403, 'Sem acesso a este time.')
    const normalized = normalizeDocument(document); if (!normalized) return fail(res, 400, 'Documento é obrigatório.')
    try { const item = await db.transaction(async (tx) => { const active = await tx.select().from(tableAny).where(and(eq(tableAny.teamId, teamId), eq(tableAny.active, true))); if (active.length >= limit) throw new Error('LIMIT'); const [created] = await tx.insert(tableAny).values({ teamId, fullName: normalizeName(fullName), document: String(document).trim(), documentNormalized: normalized }).returning(); await tx.insert(registeredDocuments).values({ documentNormalized: normalized, teamId, kind, recordId: created.id }); return created }); res.status(201).json(item) } catch (error) { return fail(res, 409, error instanceof Error && error.message === 'LIMIT' ? `LIMITE DE ${limit} ATINGIDO.` : 'Este documento já está cadastrado.') }
  })
  app.patch(`/api/${kind}s/:id`, auth, async (req: AuthedRequest, res) => { const [item] = await db.select().from(tableAny).where(eq(tableAny.id, param(req, 'id'))); if (!item) return fail(res, 404, 'Registro não encontrado.'); if (!ownTeam(req, res, item.teamId)) return fail(res, 403, 'Sem acesso.'); const [updated] = await db.update(tableAny).set({ fullName: normalizeName(req.body.fullName) }).where(eq(tableAny.id, item.id)).returning(); res.json(updated) })
  app.delete(`/api/${kind}s/:id`, auth, async (req: AuthedRequest, res) => { const [item] = await db.select().from(tableAny).where(eq(tableAny.id, param(req, 'id'))); if (!item) return fail(res, 404, 'Registro não encontrado.'); if (!ownTeam(req, res, item.teamId)) return fail(res, 403, 'Sem acesso.'); await db.transaction(async (tx) => { await tx.update(tableAny).set({ active: false }).where(eq(tableAny.id, item.id)); await tx.delete(registeredDocuments).where(eq(registeredDocuments.documentNormalized, item.documentNormalized)) }); res.status(204).end() })
}
rosterRoutes('player', players); rosterRoutes('coach', coaches)

app.get('/api/representatives', auth, admin, async (_req, res) => res.json(await db.select().from(representatives)))
app.get('/api/representatives/:teamId', auth, async (req: AuthedRequest, res) => { const teamId = param(req, 'teamId'); if (!ownTeam(req, res, teamId)) return fail(res, 403, 'Sem acesso.'); const [registration] = await db.select().from(representatives).where(eq(representatives.teamId, teamId)); res.json(registration ?? null) })
app.post('/api/representatives', async (req, res) => { const input = req.body; try { const result = await db.transaction(async (tx) => { const [registration] = await tx.insert(representatives).values({ teamId: input.teamId, rep1Name: normalizeName(input.rep1Name), rep1Phone: input.rep1Phone, rep2Name: normalizeName(input.rep2Name), rep2Phone: input.rep2Phone }).returning(); await tx.update(teams).set({ representativesSubmitted: true }).where(eq(teams.id, input.teamId)); return registration }); res.status(201).json(result) } catch { return fail(res, 409, 'Este time já enviou o cadastro.') } })
app.patch('/api/representatives/:teamId', auth, admin, async (req, res) => { const [updated] = await db.update(representatives).set(req.body).where(eq(representatives.teamId, param(req, 'teamId'))).returning(); if (!updated) return fail(res, 404, 'Cadastro não encontrado.'); res.json(updated) })
app.delete('/api/representatives/:teamId', auth, admin, async (req, res) => { const teamId = param(req, 'teamId'); await db.transaction(async (tx) => { await tx.delete(representatives).where(eq(representatives.teamId, teamId)); await tx.update(teams).set({ representativesSubmitted: false }).where(eq(teams.id, teamId)) }); res.status(204).end() })
app.post('/api/audit-logs', auth, async (req, res) => { const [entry] = await db.insert(auditLogs).values(req.body).returning(); res.status(201).json(entry) })

async function seedAdmin() { if (!process.env.ADMIN_LOGIN || !process.env.ADMIN_PASSWORD) return; const username = process.env.ADMIN_LOGIN.trim().toLowerCase(); const exists = await db.select().from(users).where(eq(users.username, username)); if (!exists.length) await db.insert(users).values({ username, passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), role: 'admin' }) }
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não foi configurada.')
await seedAdmin(); app.listen(Number(process.env.PORT ?? 3001), () => console.log('API em http://localhost:3001'))
