import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { teamLoginToEmail } from '../lib/secondaryAuth'
import type { Role, Team } from '../types'

interface AuthState {
  loading: boolean
  user: User | null
  role: Role | null
  team: Team | null
  signInAdmin: (email: string, password: string) => Promise<void>
  signInTeam: (login: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [team, setTeam] = useState<Team | null>(null)

  useEffect(() => onAuthStateChanged(auth, setUser), [])

  useEffect(() => {
    let cancelled = false
    let unsubTeam: (() => void) | undefined

    setLoading(true)
    setRole(null)
    setTeam(null)

    if (!user) {
      setLoading(false)
      return
    }

    getDoc(doc(db, 'admins', user.uid)).then((adminSnap) => {
      if (cancelled) return
      if (adminSnap.exists()) {
        setRole('admin')
        setLoading(false)
        return
      }

      // Keep the team doc live so denormalized counters (playerCount, coachCount,
      // representativesSubmitted) reflect instantly across the whole team panel.
      unsubTeam = onSnapshot(doc(db, 'teams', user.uid), (teamSnap) => {
        if (cancelled) return
        if (teamSnap.exists()) {
          setRole('team')
          setTeam({ id: teamSnap.id, ...teamSnap.data() } as Team)
        } else {
          setRole(null)
          setTeam(null)
        }
        setLoading(false)
      })
    })

    return () => {
      cancelled = true
      unsubTeam?.()
    }
  }, [user])

  const value: AuthState = {
    loading,
    user,
    role,
    team,
    async signInAdmin(email, password) {
      await signInWithEmailAndPassword(auth, email, password)
    },
    async signInTeam(login, password) {
      await signInWithEmailAndPassword(auth, teamLoginToEmail(login), password)
    },
    async signOut() {
      await firebaseSignOut(auth)
    },
    async changePassword(currentPassword, newPassword) {
      if (!auth.currentUser?.email) throw new Error('Sessão inválida.')
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  return ctx
}
