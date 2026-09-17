import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { subscribeTeams } from '../../data/teams'
import { subscribeConfig, DEFAULT_CONFIG } from '../../data/config'
import { listAllPlayers, addPlayer, removePlayer, DuplicateDocumentError, LimitReachedError } from '../../data/players'
import { maskCPF } from '../../lib/format'
import { poll } from '../../lib/api'
import type { ChampionshipConfig, Player, Team } from '../../types'

export default function AdminPlayers() {
  const toast = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [sortMode, setSortMode] = useState<'team' | 'name'>('team')

  const [formTeamId, setFormTeamId] = useState('')
  const [fullName, setFullName] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [removing, setRemoving] = useState<Player | null>(null)

  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => subscribeConfig(setConfig), [])
  useEffect(() => poll(listAllPlayers, (list) => { setPlayers(list); setLoading(false) }), [])

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

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const team = teamsById.get(formTeamId)
    if (!team) {
      toast.error('Selecione um time.')
      return
    }
    setSubmitting(true)
    try {
      await addPlayer({ teamId: team.id, teamName: team.name, fullName, document: documentNumber, limit: config.playerLimit })
      toast.success(`Jogador adicionado a ${team.name}.`)
      setFullName('')
      setDocumentNumber('')
    } catch (err) {
      if (err instanceof DuplicateDocumentError) {
        toast.error('ESTE DOCUMENTO JÁ ESTÁ CADASTRADO EM OUTRA EQUIPE.')
      } else if (err instanceof LimitReachedError) {
        toast.error(err.message)
      } else {
        toast.error('Não foi possível adicionar o jogador.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleRemove() {
    if (!removing) return
    try {
      await removePlayer({ playerId: removing.id, teamId: removing.teamId, documentNormalized: removing.documentNormalized })
      toast.success('Jogador removido.')
      setRemoving(null)
    } catch {
      toast.error('Não foi possível remover o jogador.')
    }
  }

  return (
    <div>
      <PageHeader title="JOGADORES" subtitle={`${players.length} jogadores cadastrados no campeonato.`} />

      <Card className="mb-4 p-4">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-400">Cadastrar jogador em qualquer time</h2>
        <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <Select label="Time" value={formTeamId} onChange={(e) => setFormTeamId(e.target.value)} required>
            <option value="">Selecione o time...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
          <Input label="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <Input
            label="Documento"
            hint="Opcional"
            value={documentNumber}
            onChange={(e) => setDocumentNumber(maskCPF(e.target.value))}
          />
          <Button type="submit" loading={submitting} className="h-fit">
            ADICIONAR JOGADOR
          </Button>
        </form>
      </Card>

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
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3 text-ink-400">{i + 1}</td>
                    <td className="px-5 py-3 font-semibold text-ink-900">{p.fullName}</td>
                    <td className="px-5 py-3 text-ink-500">{p.document || '—'}</td>
                    <td className="px-5 py-3 text-ink-500">{teamsById.get(p.teamId)?.name ?? p.teamId}</td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="danger" onClick={() => setRemoving(p)}>
                        Remover
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!removing}
        title="REMOVER JOGADOR"
        message={`Tem certeza que deseja remover ${removing?.fullName} do time ${teamsById.get(removing?.teamId ?? '')?.name ?? ''}?`}
        confirmLabel="REMOVER"
        danger
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
