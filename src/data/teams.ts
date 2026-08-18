import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { createTeamAuthAccount, teamLoginToEmail } from '../lib/secondaryAuth'
import { normalizeName } from '../lib/normalize'
import type { Team } from '../types'

const teamsCol = collection(db, 'teams')

export function subscribeTeams(cb: (teams: Team[]) => void) {
  const q = query(teamsCol, orderBy('name'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Team))
  })
}

export async function listTeams(): Promise<Team[]> {
  const snap = await getDocs(query(teamsCol, orderBy('name')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Team)
}

export async function getTeam(id: string): Promise<Team | null> {
  const snap = await getDoc(doc(db, 'teams', id))
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as Team) : null
}

/**
 * Admin-only. Provisions a fixed team slot (name + login/senha) — the roster of 10 teams never grows.
 * The team document's id IS the Firebase Auth uid of its account, so security rules can check
 * "is this the owning team?" with a plain uid comparison instead of an indexed lookup.
 */
export async function createTeam(input: {
  name: string
  shortName: string
  login: string
  password: string
}): Promise<string> {
  const email = teamLoginToEmail(input.login)
  const authUid = await createTeamAuthAccount(email, input.password)

  const teamRef = doc(db, 'teams', authUid)
  await setDoc(teamRef, {
    name: normalizeName(input.name),
    shortName: normalizeName(input.shortName),
    shieldUrl: null,
    login: input.login.trim().toLowerCase(),
    authUid,
    status: 'NAO_INICIADO',
    seed: null,
    primaryColor: null,
    secondaryColor: null,
    playerCount: 0,
    coachCount: 0,
    representativesSubmitted: false,
    active: true,
    createdAt: serverTimestamp(),
  })
  return teamRef.id
}

export async function updateTeam(id: string, patch: Partial<Team>) {
  await updateDoc(doc(db, 'teams', id), patch)
}
