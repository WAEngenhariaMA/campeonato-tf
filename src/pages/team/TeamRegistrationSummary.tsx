import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { formatDate } from '../../lib/format'
import { getRegistration } from '../../data/representatives'
import { poll } from '../../lib/api'
import type { RepresentativeRegistration } from '../../types'

export default function TeamRegistrationSummary() {
  const { team } = useAuth()
  const [registration, setRegistration] = useState<RepresentativeRegistration | null>(null)

  useEffect(() => {
    if (!team) return
    return poll(() => getRegistration(team.id), setRegistration)
  }, [team])

  if (!team) return null

  const rows: { label: string; value: string; tone?: 'success' | 'warning' | 'danger' | 'neutral' }[] = [
    { label: 'Time', value: team.name },
    { label: 'Situação da inscrição', value: team.status.replace(/_/g, ' ') },
    { label: 'Jogadores', value: `${team.playerCount} / 20` },
    { label: 'Comissão técnica', value: `${team.coachCount} / 2` },
    {
      label: 'Representantes',
      value: registration ? registration.status : 'NÃO ENVIADO',
      tone: registration?.status === 'APROVADO' ? 'success' : registration ? 'warning' : 'danger',
    },
    { label: 'Cadastro enviado em', value: registration ? formatDate(registration.createdAt) : '—' },
  ]

  return (
    <div>
      <PageHeader title="MINHA INSCRIÇÃO" subtitle="Resumo completo da inscrição do seu time." />
      <Card>
        <div className="divide-y divide-ink-100">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between px-5 py-4">
              <p className="text-sm font-medium text-ink-500">{row.label}</p>
              {row.tone ? (
                <Badge tone={row.tone}>{row.value}</Badge>
              ) : (
                <p className="text-sm font-bold text-ink-900">{row.value}</p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
