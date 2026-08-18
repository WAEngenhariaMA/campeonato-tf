import { api, poll } from '../lib/api'
import type { Coach } from '../types'
import { DuplicateDocumentError, LimitReachedError } from './players'

export function subscribeTeamCoaches(_teamId: string, cb: (coaches: Coach[]) => void) { return poll(() => api<Coach[]>('/coaches'), cb) }

export async function listAllCoaches(): Promise<Coach[]> {
  return api<Coach[]>('/coaches')
}

export async function addCoach(params: {
  teamId: string
  teamName: string
  fullName: string
  document: string
  limit: number
}) {
  try { return (await api<Coach>('/coaches', { method: 'POST', body: JSON.stringify(params) })).id }
  catch (error) { const message = error instanceof Error ? error.message : ''; if (message.includes('LIMITE')) throw new LimitReachedError(message); if (message.includes('documento')) throw new DuplicateDocumentError(params.teamName); throw error }
}

export async function updateCoach(params: { coachId: string; fullName: string }) {
  await api<Coach>(`/coaches/${params.coachId}`, { method: 'PATCH', body: JSON.stringify({ fullName: params.fullName }) })
}

export async function removeCoach(params: { coachId: string; teamId: string; documentNormalized: string }) {
  await api<void>(`/coaches/${params.coachId}`, { method: 'DELETE' })
}
