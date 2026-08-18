import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { subscribeTeams } from '../../data/teams'
import { computeDuplicateAlerts, type DuplicateAlert } from '../../data/duplicates'
import type { Team } from '../../types'

type Filter = 'TODOS' | 'CRITICO' | 'POSSIVEL'

export default function AdminDuplicates() {
  const [teams, setTeams] = useState<Team[]>([])
  const [alerts, setAlerts] = useState<DuplicateAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('TODOS')

  useEffect(() => subscribeTeams(setTeams), [])

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  async function refresh() {
    setLoading(true)
    const result = await computeDuplicateAlerts(teamsById)
    setAlerts(result)
    setLoading(false)
  }

  useEffect(() => {
    if (teams.length > 0) refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams.length])

  const visible = alerts.filter((a) => filter === 'TODOS' || a.level === filter)

  return (
    <div>
      <PageHeader
        title="VERIFICAÇÃO DE JOGADORES"
        subtitle="Documentos idênticos entre times diferentes são bloqueados no cadastro; nomes semelhantes ficam aqui para revisão manual."
        action={
          <Button variant="secondary" size="sm" onClick={refresh} loading={loading}>
            ATUALIZAR
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        {(['TODOS', 'CRITICO', 'POSSIVEL'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              filter === f ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
            }`}
          >
            {f === 'TODOS' ? 'Todos' : f === 'CRITICO' ? 'Documento duplicado' : 'Nome semelhante'}
          </button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={4} />
            </div>
          ) : visible.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-400">Nenhuma duplicidade encontrada.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Nível</th>
                  <th className="px-5 py-3">Jogador</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Outro jogador</th>
                  <th className="px-5 py-3">Outro time</th>
                  <th className="px-5 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((a) => (
                  <tr key={a.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3">
                      <Badge tone={a.level === 'CRITICO' ? 'danger' : 'warning'}>
                        {a.level === 'CRITICO' ? 'DUPLICIDADE CRÍTICA' : 'POSSÍVEL'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink-900">{a.playerA.fullName}</td>
                    <td className="px-5 py-3 text-ink-500">{a.teamAName}</td>
                    <td className="px-5 py-3 font-semibold text-ink-900">{a.playerB.fullName}</td>
                    <td className="px-5 py-3 text-ink-500">{a.teamBName}</td>
                    <td className="px-5 py-3 text-ink-500">{a.reason}</td>
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
