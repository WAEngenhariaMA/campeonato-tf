import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, authExpiredEvent, getToken, poll, setToken } from '../lib/api'
import type { Role, Team } from '../types'

interface SessionUser { id: string }
interface AuthState {
  loading: boolean; user: SessionUser | null; role: Role | null; team: Team | null
  signInAdmin: (login: string, password: string) => Promise<void>
  signInTeam: (login: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
}
interface SessionResponse { sub: string; role: Role; teamId: string | null; team: Team | null }
const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [team, setTeam] = useState<Team | null>(null)
  const applySession = (session: SessionResponse) => { setUser({ id: session.sub }); setRole(session.role); setTeam(session.team) }
  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    return poll(
      () => api<SessionResponse>('/auth/me'),
      (session) => { applySession(session); setLoading(false) },
    )
  }, [])
  useEffect(() => {
    const clearSession = () => { setToken(null); setUser(null); setRole(null); setTeam(null); setLoading(false) }
    window.addEventListener(authExpiredEvent, clearSession)
    return () => window.removeEventListener(authExpiredEvent, clearSession)
  }, [])
  const login = async (loginValue: string, password: string, admin: boolean) => {
    const result = await api<{ token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ login: loginValue, password, admin }) })
    setToken(result.token); applySession(await api<SessionResponse>('/auth/me'))
  }
  return <AuthContext.Provider value={{ loading, user, role, team, signInAdmin: (loginValue, password) => login(loginValue, password, true), signInTeam: (loginValue, password) => login(loginValue, password, false), async signOut() { setToken(null); setUser(null); setRole(null); setTeam(null) }, async changePassword(currentPassword, newPassword) { await api<void>('/auth/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }) } }}>{children}</AuthContext.Provider>
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider.'); return ctx }
