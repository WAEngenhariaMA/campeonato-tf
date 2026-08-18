import { collection, doc, getDoc, onSnapshot, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { normalizeName } from '../lib/normalize'
import type { RepresentativeRegistration } from '../types'

const col = collection(db, 'representativeRegistrations')

/**
 * Public — used by the unauthenticated registration form. The Firestore rule for this
 * collection rejects the create if a registration already exists for the team, so a stale
 * dropdown (team registered a second ago in another tab) fails safely instead of overwriting.
 */
export async function submitRegistration(input: {
  teamId: string
  rep1Name: string
  rep1Phone: string
  rep2Name: string
  rep2Phone: string
}) {
  const batch = writeBatch(db)
  batch.set(doc(col, input.teamId), {
    teamId: input.teamId,
    rep1Name: normalizeName(input.rep1Name),
    rep1Phone: input.rep1Phone,
    rep2Name: normalizeName(input.rep2Name),
    rep2Phone: input.rep2Phone,
    status: 'PENDENTE',
    createdAt: serverTimestamp(),
  })
  batch.update(doc(db, 'teams', input.teamId), { representativesSubmitted: true })
  await batch.commit()
}

export function subscribeRegistrations(cb: (regs: RepresentativeRegistration[]) => void) {
  return onSnapshot(col, (snap) => {
    cb(snap.docs.map((d) => d.data() as RepresentativeRegistration))
  })
}

export async function getRegistration(teamId: string): Promise<RepresentativeRegistration | null> {
  const snap = await getDoc(doc(col, teamId))
  return snap.exists() ? (snap.data() as RepresentativeRegistration) : null
}

/** Admin-only. */
export async function updateRegistration(teamId: string, patch: Partial<RepresentativeRegistration>) {
  await updateDoc(doc(col, teamId), patch)
}

/** Admin-only — used to "reset" a team's registration so it can be resubmitted. */
export async function deleteRegistration(teamId: string) {
  const batch = writeBatch(db)
  batch.delete(doc(col, teamId))
  batch.update(doc(db, 'teams', teamId), { representativesSubmitted: false })
  await batch.commit()
}
