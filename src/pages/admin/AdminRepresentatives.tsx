import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { subscribeTeams } from '../../data/teams'
import { subscribeRegistrations, updateRegistration } from '../../data/representatives'
import { formatDate } from '../../lib/format'
import type { RepresentativeRegistration, Team } from '../../types'

const STATUS_TONE = { PENDENTE: 'warning', APROVADO: 'success', REJEITADO: 'danger' } as const

export default function AdminRepresentatives() {
  const toast = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [registrations, setRegistrations] = useState<RepresentativeRegistration[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => {
    const unsub = subscribeRegistrations((list) => {
      setRegistrations(list)
      setLoading(false)
    })
    return unsub
  }, [])

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const sorted = useMemo(
    () => [...registrations].sort((a, b) => (teamsById.get(a.teamId)?.name ?? '').localeCompare(teamsById.get(b.teamId)?.name ?? '')),
    [registrations, teamsById],
  )

  async function setStatus(teamId: string, status: 'APROVADO' | 'REJEITADO') {
    try {
      await updateRegistration(teamId, { status })
      toast.success(status === 'APROVADO' ? 'Cadastro aprovado.' : 'Cadastro rejeitado.')
    } catch {
      toast.error('Não foi possível atualizar a situação.')
    }
  }

  return (
    <div>
      <PageHeader title="REPRESENTANTES" subtitle="Cadastros enviados pelos times." />
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : sorted.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-400">Nenhum cadastro enviado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Representante 1</th>
                  <th className="px-5 py-3">Telefone</th>
                  <th className="px-5 py-3">Representante 2</th>
                  <th className="px-5 py-3">Telefone</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3">Situação</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.teamId} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3 font-semibold text-ink-900">{teamsById.get(r.teamId)?.name ?? r.teamId}</td>
                    <td className="px-5 py-3 text-ink-500">{r.rep1Name}</td>
                    <td className="px-5 py-3 text-ink-500">{r.rep1Phone}</td>
                    <td className="px-5 py-3 text-ink-500">{r.rep2Name}</td>
                    <td className="px-5 py-3 text-ink-500">{r.rep2Phone}</td>
                    <td className="px-5 py-3 text-ink-500">{formatDate(r.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {r.status !== 'APROVADO' && (
                        <Button size="sm" variant="primary" className="mr-1.5" onClick={() => setStatus(r.teamId, 'APROVADO')}>
                          Aprovar
                        </Button>
                      )}
                      {r.status !== 'REJEITADO' && (
                        <Button size="sm" variant="danger" onClick={() => setStatus(r.teamId, 'REJEITADO')}>
                          Rejeitar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
