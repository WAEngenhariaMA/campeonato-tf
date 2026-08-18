import { api, poll } from '../lib/api'
import type { Player } from '../types'

export class DuplicateDocumentError extends Error {
  teamName: string
  constructor(teamName: string) {
    super(`Este documento já está cadastrado no time ${teamName}.`)
    this.teamName = teamName
  }
}

export class LimitReachedError extends Error {}

export function subscribeTeamPlayers(_teamId: string, cb: (players: Player[]) => void) { return poll(() => api<Player[]>('/players'), cb) }

export async function listAllPlayers(): Promise<Player[]> {
  return api<Player[]>('/players')
}

export async function addPlayer(params: {
  teamId: string
  teamName: string
  fullName: string
  document: string
  limit: number
}) {
  try { return (await api<Player>('/players', { method: 'POST', body: JSON.stringify(params) })).id }
  catch (error) { const message = error instanceof Error ? error.message : ''; if (message.includes('LIMITE')) throw new LimitReachedError(message); if (message.includes('documento')) throw new DuplicateDocumentError(params.teamName); throw error }
}

export async function updatePlayer(params: {
  playerId: string
  teamId: string
  fullName: string
}) {
  await api<Player>(`/players/${params.playerId}`, { method: 'PATCH', body: JSON.stringify({ fullName: params.fullName }) })
}

/** Soft delete: keeps history per section 48, frees a roster slot, and releases the document index entry. */
export async function removePlayer(params: { playerId: string; teamId: string; documentNormalized: string }) {
  await api<void>(`/players/${params.playerId}`, { method: 'DELETE' })
}
