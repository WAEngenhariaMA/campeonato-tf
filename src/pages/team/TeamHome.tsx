import { useEffect, useState } from 'react'
import { Users, UserCog, Contact, ClipboardList, GitBranch } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatCard } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { getRegistration } from '../../data/representatives'
import { poll } from '../../lib/api'
import type { RepresentativeRegistration } from '../../types'

const STATUS_TONE = { PENDENTE: 'warning', APROVADO: 'success', REJEITADO: 'danger' } as const

export default function TeamHome() {
  const { team } = useAuth()
  const [registration, setRegistration] = useState<RepresentativeRegistration | null>(null)

  useEffect(() => {
    if (!team) return
    return poll(() => getRegistration(team.id), setRegistration)
  }, [team])

  if (!team) return null

  return (
    <div>
      <PageHeader title={`BEM-VINDO, ${team.name}`} subtitle="Resumo da sua equipe" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Jogadores" value={`${team.playerCount} / 20`} tone="brand" />
        <StatCard icon={UserCog} label="Comissão técnica" value={`${team.coachCount} / 2`} tone="brand" />
        <StatCard
          icon={Contact}
          label="Representantes"
          value={registration ? 'ENVIADO' : 'PENDENTE'}
          sublabel={registration?.status}
          tone={registration ? 'brand' : 'gold'}
        />
        <StatCard
          icon={ClipboardList}
          label="Situação da inscrição"
          value={team.status.replace(/_/g, ' ')}
          tone={team.status === 'COMPLETO' ? 'brand' : 'default'}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-400"><GitBranch size={15} /> Próximo confronto</h2>
        <p className="mt-3 text-sm text-ink-500">
          Os confrontos serão exibidos aqui assim que o sorteio oficial for realizado e confirmado pela organização.
        </p>
      </div>

      {registration && (
        <div className="mt-6 rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">Representantes</h2>
            <Badge tone={STATUS_TONE[registration.status]}>{registration.status}</Badge>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-ink-900">{registration.rep1Name}</p>
              <p className="text-sm text-ink-500">{registration.rep1Phone}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">{registration.rep2Name}</p>
              <p className="text-sm text-ink-500">{registration.rep2Phone}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
