import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import type { Role } from '../../types'

export function Protected({ role, redirectTo, children }: { role: Role; redirectTo: string; children: ReactNode }) {
  const { loading, role: currentRole } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-ink-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ink-200 border-t-brand-600" />
      </div>
    )
  }

  if (currentRole !== role) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
