import { api } from '../lib/api'

export async function logAction(params: {
  userId: string
  userLabel: string
  action: string
  entity: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
}) {
  await api('/audit-logs', { method: 'POST', body: JSON.stringify(params) })
}
