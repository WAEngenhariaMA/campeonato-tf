import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'

export async function logAction(params: {
  userId: string
  userLabel: string
  action: string
  entity: string
  entityId: string
  oldValue?: unknown
  newValue?: unknown
}) {
  await addDoc(collection(db, 'auditLogs'), {
    userId: params.userId,
    userLabel: params.userLabel,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    oldValue: params.oldValue ?? null,
    newValue: params.newValue ?? null,
    createdAt: serverTimestamp(),
  })
}
