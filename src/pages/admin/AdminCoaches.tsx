import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Input, Select } from '../../components/ui/Input'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { subscribeTeams } from '../../data/teams'
import { listAllCoaches } from '../../data/coaches'
import { poll } from '../../lib/api'
import type { Coach, Team } from '../../types'

export default function AdminCoaches() {
  const [teams, setTeams] = useState<Team[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')

  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => poll(listAllCoaches, (list) => { setCoaches(list); setLoading(false) }), [])

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  const rows = useMemo(() => {
    let list = coaches
    if (teamFilter) list = list.filter((c) => c.teamId === teamFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => c.fullName.toLowerCase().includes(q) || c.documentNormalized.includes(q.toUpperCase()))
    }
    return [...list].sort((a, b) => {
      const teamA = teamsById.get(a.teamId)?.name ?? ''
      const teamB = teamsById.get(b.teamId)?.name ?? ''
      return teamA.localeCompare(teamB) || a.fullName.localeCompare(b.fullName)
    })
  }, [coaches, teamFilter, search, teamsById])

  return (
    <div>
      <PageHeader title="TÉCNICOS" subtitle={`${coaches.length} membros de comissão técnica cadastrados.`} />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Buscar por nome ou documento..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">Todos os times</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={4} />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Nome</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3 font-semibold text-ink-900">{c.fullName}</td>
                    <td className="px-5 py-3 text-ink-500">{c.document}</td>
                    <td className="px-5 py-3 text-ink-500">{teamsById.get(c.teamId)?.name ?? c.teamId}</td>
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
