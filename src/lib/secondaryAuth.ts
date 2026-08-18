import { deleteApp, getApps, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { app } from './firebase'

/**
 * Creating a Firebase Auth user with the client SDK signs the caller in as
 * that new user. Provisioning team accounts happens while an admin is
 * signed in, so we spin up a throwaway secondary app instance to create the
 * account without disturbing the admin's session, then tear it down.
 */
export async function createTeamAuthAccount(email: string, password: string) {
  const name = `secondary-${Date.now()}`
  const secondaryApp = initializeApp(app.options, name)
  try {
    const secondaryAuth = getAuth(secondaryApp)
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    const uid = credential.user.uid
    await signOut(secondaryAuth)
    return uid
  } finally {
    const existing = getApps().find((a) => a.name === name)
    if (existing) await deleteApp(existing)
  }
}

export function teamLoginToEmail(login: string): string {
  return `${login.trim().toLowerCase()}@teams.campeonato.app`
}
