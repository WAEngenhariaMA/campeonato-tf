import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatCard } from '../../components/ui/Card'
import { subscribeTeams } from '../../data/teams'
import { subscribeRegistrations } from '../../data/representatives'
import { computeDuplicateAlerts } from '../../data/duplicates'
import { subscribeConfig, DEFAULT_CONFIG } from '../../data/config'
import type { ChampionshipConfig, RepresentativeRegistration, Team } from '../../types'

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [registrations, setRegistrations] = useState<RepresentativeRegistration[]>([])
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [duplicateCount, setDuplicateCount] = useState<number | null>(null)

  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => subscribeRegistrations(setRegistrations), [])
  useEffect(() => subscribeConfig(setConfig), [])

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  useEffect(() => {
    if (teams.length === 0) return
    computeDuplicateAlerts(teamsById).then((alerts) => setDuplicateCount(alerts.length))
  }, [teams, teamsById])

  const totalPlayers = teams.reduce((sum, t) => sum + (t.playerCount ?? 0), 0)
  const totalCoaches = teams.reduce((sum, t) => sum + (t.coachCount ?? 0), 0)
  const approvedReps = registrations.filter((r) => r.status === 'APROVADO').length

  return (
    <div>
      <PageHeader title="DASHBOARD" subtitle={`${config.name} — Temporada ${config.season}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Equipes" value={`${teams.length} / ${config.teamCount}`} tone="brand" />
        <StatCard label="Jogadores cadastrados" value={`${totalPlayers} / ${config.teamCount * config.playerLimit}`} />
        <StatCard label="Técnicos" value={`${totalCoaches} / ${config.teamCount * config.coachLimit}`} />
        <StatCard label="Representantes aprovados" value={`${approvedReps} / ${config.teamCount}`} />
        <StatCard label="Jogos realizados" value="0 / 11" sublabel="Fase de confrontos ainda não iniciada" />
        <StatCard label="Gols" value="0" />
        <StatCard label="Cartões amarelos" value="0" />
        <StatCard label="Cartões vermelhos" value="0" />
        <StatCard
          label="Possíveis duplicidades"
          value={duplicateCount === null ? '...' : String(duplicateCount)}
          tone={duplicateCount ? 'danger' : 'default'}
        />
        <StatCard
          label="Inscrições"
          value={config.registrationsOpen ? 'ABERTAS' : 'ENCERRADAS'}
          tone={config.registrationsOpen ? 'brand' : 'danger'}
        />
      </div>
    </div>
  )
}
