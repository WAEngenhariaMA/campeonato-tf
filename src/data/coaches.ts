import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { normalizeDocument, normalizeName } from '../lib/normalize'
import type { Coach } from '../types'
import { DuplicateDocumentError, LimitReachedError } from './players'

const coachesCol = collection(db, 'coaches')
const indexCol = collection(db, 'coachDocumentIndex')

export function subscribeTeamCoaches(teamId: string, cb: (coaches: Coach[]) => void) {
  const q = query(coachesCol, where('teamId', '==', teamId), where('active', '==', true), orderBy('fullName'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coach))
  })
}

export async function listAllCoaches(): Promise<Coach[]> {
  const snap = await getDocs(query(coachesCol, where('active', '==', true), orderBy('fullName')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Coach)
}

export async function addCoach(params: {
  teamId: string
  teamName: string
  fullName: string
  document: string
  limit: number
}) {
  const documentNormalized = normalizeDocument(params.document)
  if (!documentNormalized) throw new Error('Documento é obrigatório.')
  const fullName = normalizeName(params.fullName)

  const teamRef = doc(db, 'teams', params.teamId)
  const indexRef = doc(indexCol, documentNormalized)
  const coachRef = doc(coachesCol)

  await runTransaction(db, async (tx) => {
    const [teamSnap, indexSnap] = await Promise.all([tx.get(teamRef), tx.get(indexRef)])
    if (!teamSnap.exists()) throw new Error('Time não encontrado.')

    if (indexSnap.exists()) {
      const existing = indexSnap.data()
      throw new DuplicateDocumentError(existing.teamName)
    }

    const currentCount = (teamSnap.data().coachCount as number) ?? 0
    if (currentCount >= params.limit) {
      throw new LimitReachedError(`LIMITE DE ${params.limit} TÉCNICOS ATINGIDO.`)
    }

    tx.set(coachRef, {
      teamId: params.teamId,
      fullName,
      document: params.document.trim(),
      documentNormalized,
      active: true,
      createdAt: serverTimestamp(),
    })
    tx.set(indexRef, {
      documentNormalized,
      teamId: params.teamId,
      teamName: params.teamName,
      playerId: coachRef.id,
      kind: 'coach',
    })
    tx.update(teamRef, { coachCount: currentCount + 1 })
  })

  return coachRef.id
}

export async function updateCoach(params: { coachId: string; fullName: string }) {
  await runTransaction(db, async (tx) => {
    tx.update(doc(coachesCol, params.coachId), { fullName: normalizeName(params.fullName) })
  })
}

export async function removeCoach(params: { coachId: string; teamId: string; documentNormalized: string }) {
  const coachRef = doc(coachesCol, params.coachId)
  const teamRef = doc(db, 'teams', params.teamId)
  const indexRef = doc(indexCol, params.documentNormalized)

  await runTransaction(db, async (tx) => {
    const teamSnap = await tx.get(teamRef)
    const currentCount = (teamSnap.data()?.coachCount as number) ?? 0
    tx.update(coachRef, { active: false })
    tx.delete(indexRef)
    tx.update(teamRef, { coachCount: Math.max(0, currentCount - 1) })
  })
}
