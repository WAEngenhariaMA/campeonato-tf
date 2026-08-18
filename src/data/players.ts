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
import type { Player } from '../types'

const playersCol = collection(db, 'players')
const indexCol = collection(db, 'documentIndex')

export class DuplicateDocumentError extends Error {
  teamName: string
  constructor(teamName: string) {
    super(`Este documento já está cadastrado no time ${teamName}.`)
    this.teamName = teamName
  }
}

export class LimitReachedError extends Error {}

export function subscribeTeamPlayers(teamId: string, cb: (players: Player[]) => void) {
  const q = query(playersCol, where('teamId', '==', teamId), where('active', '==', true), orderBy('fullName'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Player))
  })
}

export async function listAllPlayers(): Promise<Player[]> {
  const snap = await getDocs(query(playersCol, where('active', '==', true), orderBy('fullName')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Player)
}

export async function addPlayer(params: {
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
  const playerRef = doc(playersCol)

  await runTransaction(db, async (tx) => {
    const [teamSnap, indexSnap] = await Promise.all([tx.get(teamRef), tx.get(indexRef)])
    if (!teamSnap.exists()) throw new Error('Time não encontrado.')

    if (indexSnap.exists()) {
      const existing = indexSnap.data()
      throw new DuplicateDocumentError(existing.teamName)
    }

    const currentCount = (teamSnap.data().playerCount as number) ?? 0
    if (currentCount >= params.limit) {
      throw new LimitReachedError(`LIMITE DE ${params.limit} JOGADORES ATINGIDO.`)
    }

    tx.set(playerRef, {
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
      playerId: playerRef.id,
      kind: 'player',
    })
    tx.update(teamRef, { playerCount: currentCount + 1 })
  })

  return playerRef.id
}

export async function updatePlayer(params: {
  playerId: string
  teamId: string
  fullName: string
}) {
  const playerRef = doc(playersCol, params.playerId)
  await runTransaction(db, async (tx) => {
    tx.update(playerRef, { fullName: normalizeName(params.fullName) })
  })
}

/** Soft delete: keeps history per section 48, frees a roster slot, and releases the document index entry. */
export async function removePlayer(params: { playerId: string; teamId: string; documentNormalized: string }) {
  const playerRef = doc(playersCol, params.playerId)
  const teamRef = doc(db, 'teams', params.teamId)
  const indexRef = doc(indexCol, params.documentNormalized)

  await runTransaction(db, async (tx) => {
    const teamSnap = await tx.get(teamRef)
    const currentCount = (teamSnap.data()?.playerCount as number) ?? 0
    tx.update(playerRef, { active: false })
    tx.delete(indexRef)
    tx.update(teamRef, { playerCount: Math.max(0, currentCount - 1) })
  })
}
