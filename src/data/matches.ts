import { api, poll } from '../lib/api'
import type { Card, Goal, Match, Standing } from '../types'

type ApiMatch = Omit<Match, 'date' | 'time'> & { matchDate: string | null; matchTime: string | null }

function toMatch(match: ApiMatch): Match {
  const { matchDate, matchTime, ...rest } = match
  return { ...rest, date: matchDate, time: matchTime }
}
const byMatchNumber = (a: Match, b: Match) => Number(a.matchNumber.slice(1)) - Number(b.matchNumber.slice(1))

export async function listMatches() { return (await api<ApiMatch[]>('/matches')).map(toMatch).sort(byMatchNumber) }
export function subscribeMatches(callback: (matches: Match[]) => void) { return poll(listMatches, callback) }
export async function createOfficialSchedule() { return (await api<ApiMatch[]>('/matches/schedule', { method: 'POST' })).map(toMatch) }
export async function updateMatch(id: string, patch: Partial<Match>) {
  const { date, time, ...rest } = patch
  return toMatch(await api<ApiMatch>(`/matches/${id}`, { method: 'PATCH', body: JSON.stringify({ ...rest, ...(date !== undefined ? { matchDate: date } : {}), ...(time !== undefined ? { matchTime: time } : {}) }) }))
}
export type MatchReportData = { match: ApiMatch; report: unknown; goals: Goal[]; cards: Card[] }
export async function getMatchReport(id: string) { const report = await api<MatchReportData>(`/matches/${id}/report`); return { ...report, match: toMatch(report.match) } }
export async function addGoal(input: Omit<Goal, 'id'>) { return api<Goal>('/goals', { method: 'POST', body: JSON.stringify(input) }) }
export async function removeGoal(id: string) { return api<void>(`/goals/${id}`, { method: 'DELETE' }) }
export async function addCard(input: Omit<Card, 'id'>) { return api<Card>('/cards', { method: 'POST', body: JSON.stringify(input) }) }
export async function removeCard(id: string) { return api<void>(`/cards/${id}`, { method: 'DELETE' }) }
export async function deleteMatchResult(id: string) { return api<void>(`/matches/${id}/result`, { method: 'DELETE' }) }
export type PublicEvent = { id: string; matchId: string; teamId: string; playerId: string; playerName: string; teamName: string; minute: number; period?: string; cardType?: 'AMARELO' | 'VERMELHO'; reason?: string | null; suspensionMatches?: number }
export type MatchHistory = { matchId: string; goals: PublicEvent[]; cards: PublicEvent[] }
export type DisciplinaryPlayer = { playerId: string; playerName: string; teamId: string; teamName: string; yellowCards: number; redCards: number; suspensionMatches: number }
export async function getTournament() { const data = await api<{ matches: ApiMatch[]; standings: Standing[]; firstPhaseFinished: boolean; disciplinary: DisciplinaryPlayer[]; history: MatchHistory[] }>('/tournament'); return { ...data, matches: data.matches.map(toMatch).sort(byMatchNumber) } }
