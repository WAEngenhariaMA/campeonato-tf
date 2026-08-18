import { api, poll } from '../lib/api'
import type { Team } from '../types'

export function subscribeTeams(cb: (teams: Team[]) => void) { return poll(() => listTeams(), cb) }

export async function listTeams(): Promise<Team[]> {
  return api<Team[]>('/teams')
}

export async function getTeam(id: string): Promise<Team | null> {
  return api<Team>(`/teams/${id}`).catch(() => null)
}

/**
 * Admin-only. Provisions a fixed team slot (name + login/senha); a conta é criada na API.
 */
export async function createTeam(input: {
  name: string
  shortName: string
  login: string
  password: string
}): Promise<string> {
  const team = await api<Team>('/teams', { method: 'POST', body: JSON.stringify(input) })
  return team.id
}

export async function updateTeam(id: string, patch: Partial<Team>) {
  await api<Team>(`/teams/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

/** Admin-only: substitui a senha do time; senhas existentes nunca são recuperáveis. */
export async function resetTeamPassword(id: string, password: string) {
  await api<void>(`/teams/${id}/password`, { method: 'POST', body: JSON.stringify({ password }) })
}

/** Admin-only: remove equipe, conta de acesso e cadastros vinculados. */
export async function removeTeam(id: string) {
  await api<void>(`/teams/${id}`, { method: 'DELETE' })
}
