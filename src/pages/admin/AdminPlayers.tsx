import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Input, Select } from '../../components/ui/Input'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { subscribeTeams } from '../../data/teams'
import { listAllPlayers } from '../../data/players'
import type { Player, Team } from '../../types'

export default function AdminPlayers() {
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [sortMode, setSortMode] = useState<'team' | 'name'>('team')

  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => {
    listAllPlayers()
      .then(setPlayers)
      .finally(() => setLoading(false))
  }, [])

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  const rows = useMemo(() => {
    let list = players
    if (teamFilter) list = list.filter((p) => p.teamId === teamFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => p.fullName.toLowerCase().includes(q) || p.documentNormalized.includes(q.toUpperCase()))
    }
    return [...list].sort((a, b) => {
      if (sortMode === 'name') return a.fullName.localeCompare(b.fullName)
      const teamA = teamsById.get(a.teamId)?.name ?? ''
      const teamB = teamsById.get(b.teamId)?.name ?? ''
      return teamA.localeCompare(teamB) || a.fullName.localeCompare(b.fullName)
    })
  }, [players, teamFilter, search, sortMode, teamsById])

  return (
    <div>
      <PageHeader title="JOGADORES" subtitle={`${players.length} jogadores cadastrados no campeonato.`} />

      <Card className="mb-4 p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Buscar por nome ou documento..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
            <option value="">Todos os times</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as 'team' | 'name')}>
            <option value="team">Ordenar por time → jogador</option>
            <option value="name">Ordenar por jogador (A-Z)</option>
          </Select>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Nº</th>
                  <th className="px-5 py-3">Jogador</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3 text-ink-400">{i + 1}</td>
                    <td className="px-5 py-3 font-semibold text-ink-900">{p.fullName}</td>
                    <td className="px-5 py-3 text-ink-500">{p.document}</td>
                    <td className="px-5 py-3 text-ink-500">{teamsById.get(p.teamId)?.name ?? p.teamId}</td>
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
