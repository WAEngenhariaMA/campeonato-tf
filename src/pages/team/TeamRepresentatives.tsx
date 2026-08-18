import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { getRegistration } from '../../data/representatives'
import type { RepresentativeRegistration } from '../../types'

const STATUS_TONE = { PENDENTE: 'warning', APROVADO: 'success', REJEITADO: 'danger' } as const

export default function TeamRepresentatives() {
  const { team } = useAuth()
  const [registration, setRegistration] = useState<RepresentativeRegistration | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!team) return
    getRegistration(team.id).then((r) => {
      setRegistration(r)
      setLoading(false)
    })
  }, [team])

  return (
    <div>
      <PageHeader title="REPRESENTANTES" subtitle="Consulta dos representantes do seu time." />
      <Card className="p-5">
        {loading ? (
          <TableSkeleton rows={2} cols={2} />
        ) : !registration ? (
          <p className="text-sm text-ink-400">Nenhum representante cadastrado ainda.</p>
        ) : (
          <div>
            <Badge tone={STATUS_TONE[registration.status]}>{registration.status}</Badge>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Representante 1</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{registration.rep1Name}</p>
                <p className="text-sm text-ink-500">{registration.rep1Phone}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Representante 2</p>
                <p className="mt-1 text-sm font-semibold text-ink-900">{registration.rep2Name}</p>
                <p className="text-sm text-ink-500">{registration.rep2Phone}</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
