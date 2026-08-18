import { api, poll } from '../lib/api'
import type { RepresentativeRegistration } from '../types'

/**
 * Público. A chave primária no PostgreSQL impede a duplicação mesmo com duas abas abertas.
 */
export async function submitRegistration(input: {
  teamId: string
  rep1Name: string
  rep1Phone: string
  rep2Name: string
  rep2Phone: string
}) {
  await api<RepresentativeRegistration>('/representatives', { method: 'POST', body: JSON.stringify(input) })
}

export function subscribeRegistrations(cb: (regs: RepresentativeRegistration[]) => void) {
  return poll(() => api<RepresentativeRegistration[]>('/representatives'), cb)
}

export async function getRegistration(teamId: string): Promise<RepresentativeRegistration | null> {
  return api<RepresentativeRegistration | null>(`/representatives/${teamId}`)
}

/** Admin-only. */
export async function updateRegistration(teamId: string, patch: Partial<RepresentativeRegistration>) {
  await api<RepresentativeRegistration>(`/representatives/${teamId}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

/** Admin-only — used to "reset" a team's registration so it can be resubmitted. */
export async function deleteRegistration(teamId: string) {
  await api<void>(`/representatives/${teamId}`, { method: 'DELETE' })
}
