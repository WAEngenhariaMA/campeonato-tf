import { useEffect, useMemo, useState } from 'react'
import { Shield, Users, UserCog, UserRound, ListChecks, Goal, Square, Copy, Lock } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { StatCard } from '../../components/ui/Card'
import { subscribeTeams } from '../../data/teams'
import { subscribeRegistrations } from '../../data/representatives'
import { computeDuplicateAlerts } from '../../data/duplicates'
import { subscribeConfig, DEFAULT_CONFIG } from '../../data/config'
import { getTournament } from '../../data/matches'
import type { ChampionshipConfig, RepresentativeRegistration, Team } from '../../types'

export default function AdminDashboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [registrations, setRegistrations] = useState<RepresentativeRegistration[]>([])
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [duplicateCount, setDuplicateCount] = useState<number | null>(null)
  const [tournament, setTournament] = useState<{ completed: number; goals: number; yellow: number; red: number } | null>(null)

  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => subscribeRegistrations(setRegistrations), [])
  useEffect(() => subscribeConfig(setConfig), [])
  useEffect(() => {
    const load = () =>
      getTournament()
        .then((data) => {
          const completed = data.matches.filter((m) => m.status === 'ENCERRADO' || m.status === 'WO').length
          const goals = data.matches.reduce((sum, m) => sum + m.goalsA + m.goalsB, 0)
          const yellow = data.standings.reduce((sum, s) => sum + s.yellowCards, 0)
          const red = data.standings.reduce((sum, s) => sum + s.redCards, 0)
          setTournament({ completed, goals, yellow, red })
        })
        .catch(() => undefined)
    void load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [])

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
        <StatCard icon={Shield} label="Equipes" value={`${teams.length} / ${config.teamCount}`} tone="brand" />
        <StatCard icon={Users} label="Jogadores cadastrados" value={`${totalPlayers} / ${config.teamCount * config.playerLimit}`} />
        <StatCard icon={UserCog} label="Técnicos" value={`${totalCoaches} / ${config.teamCount * config.coachLimit}`} />
        <StatCard icon={UserRound} label="Representantes aprovados" value={`${approvedReps} / ${config.teamCount}`} />
        <StatCard
          icon={ListChecks}
          label="Jogos realizados"
          value={tournament ? `${tournament.completed} / 11` : '...'}
          sublabel={tournament && tournament.completed === 0 ? 'Fase de confrontos ainda não iniciada' : undefined}
          tone="brand"
        />
        <StatCard icon={Goal} label="Gols" value={tournament ? String(tournament.goals) : '...'} />
        <StatCard icon={Square} label="Cartões amarelos" value={tournament ? String(tournament.yellow) : '...'} tone="gold" />
        <StatCard icon={Square} label="Cartões vermelhos" value={tournament ? String(tournament.red) : '...'} tone="danger" />
        <StatCard
          icon={Copy}
          label="Possíveis duplicidades"
          value={duplicateCount === null ? '...' : String(duplicateCount)}
          tone={duplicateCount ? 'danger' : 'default'}
        />
        <StatCard
          icon={Lock}
          label="Inscrições"
          value={config.registrationsOpen ? 'ABERTAS' : 'ENCERRADAS'}
          tone={config.registrationsOpen ? 'brand' : 'danger'}
        />
      </div>
    </div>
  )
}
