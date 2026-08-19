import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, Goal as GoalIcon, Crown, ShieldCheck, Ban, Square as SquareIcon } from 'lucide-react'
import { StatCard } from '../../components/public/StatCard'
import { StandingsTable } from '../../components/public/StandingsTable'
import { LeadersCard } from '../../components/public/LeadersCard'
import { CriteriaCard } from '../../components/public/CriteriaCard'
import { BracketView } from '../../components/public/BracketView'
import { MatchCard } from '../../components/public/MatchCard'
import { MatchModal } from '../../components/public/MatchModal'
import { PublicSidebar } from '../../components/public/PublicSidebar'
import { getTournament, buildScorers, type MatchHistory } from '../../data/matches'
import { subscribeTeams } from '../../data/teams'
import type { Match, Standing, Team } from '../../types'
import { DEFAULT_CONFIG, subscribeConfig } from '../../data/config'
import type { ChampionshipConfig } from '../../types'
import type { TabKey } from './PublicTournamentPanel.types'

export default function PublicTournamentPanel() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as TabKey) ?? 'classificacao'
  const setTab = (next: TabKey) => setSearchParams(next === 'classificacao' ? {} : { tab: next }, { replace: true })

  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [matches, setMatches] = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [history, setHistory] = useState<MatchHistory[]>([])
  const [disciplinary, setDisciplinary] = useState<{ playerId: string; playerName: string; teamName: string; yellowCards: number; redCards: number; suspensionMatches: number }[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [selected, setSelected] = useState<Match | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => subscribeConfig(setConfig), [])
  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => {
    let alive = true
    const load = () =>
      getTournament()
        .then((data) => {
          if (!alive) return
          setMatches(data.matches)
          setStandings(data.standings)
          setHistory(data.history)
          setDisciplinary(data.disciplinary)
          setLastSync(new Date())
        })
        .catch(() => undefined)
    void load()
    const timer = setInterval(load, 20_000)
    return () => {
      alive = false
      clearInterval(timer)
    }
  }, [])

  const teamsById = useMemo(() => new Map(teams.map((team) => [team.id, team])), [teams])
  const teamName = (id: string | null) => (id ? (teamsById.get(id)?.name ?? 'A DEFINIR') : 'A DEFINIR')
  const teamShield = (id: string | null) => (id ? teamsById.get(id)?.shieldUrl : null)
  const details = history.find((item) => item.matchId === selected?.id)
  const completed = matches.filter((match) => match.status === 'ENCERRADO' || match.status === 'WO')
  const scorers = useMemo(() => buildScorers(history), [history])
  const totalGoals = matches.reduce((sum, m) => sum + m.goalsA + m.goalsB, 0)
  const bestDefense = [...standings].filter((s) => s.games > 0).sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0]

  return (
    <PublicSidebar tab={tab} onSelect={setTab} logoUrl={config.logoUrl ?? ''} championshipName={config.name} lastSync={lastSync}>
      {/* Header escuro com estatísticas */}
      <header className="bg-[linear-gradient(125deg,#020816,#062b68)] px-6 py-7 text-white sm:px-8">
        <p className="text-xs font-bold tracking-[.2em] text-gold-400">PAINEL OFICIAL • ATUALIZAÇÃO AO VIVO</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">CENTRAL DO CAMPEONATO</h1>
        <p className="mt-1.5 text-sm text-blue-100">Classificação, jogos, artilharia, histórico e critérios — tudo em um só lugar.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard icon={CheckCircle2} label="Jogos finalizados" value={`${completed.length}/11`} />
          <StatCard icon={GoalIcon} label="Gols no campeonato" value={String(totalGoals)} />
          <StatCard icon={Crown} label="Líder geral" value={standings[0]?.teamName ?? '—'} />
          <StatCard icon={ShieldCheck} label="Melhor defesa" value={bestDefense ? `${bestDefense.teamName} (${bestDefense.goalsAgainst})` : '—'} />
        </div>
      </header>

      <div className="px-6 py-8 sm:px-8">
        {tab === 'classificacao' && (
          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black">CLASSIFICAÇÃO</h2>
                <p className="text-sm text-ink-500">Critérios: vitórias, saldo de gols, gols pró, gols contra, menos vermelhos e menos amarelos.</p>
              </div>
              <span className="text-xs text-ink-400">SG saldo · GP pró · GC contra · CV vermelho · CA amarelo</span>
            </div>
            <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
              <StandingsTable standings={standings} teamsById={teamsById} />
              <LeadersCard standings={standings} teamsById={teamsById} topScorer={scorers[0] ?? null} />
            </div>
          </section>
        )}

        {tab === 'jogos' && (
          <section>
            <h2 className="mb-4 text-2xl font-black">JOGOS E FASES</h2>
            <BracketView matches={matches} teamsById={teamsById} onSelect={setSelected} />
          </section>
        )}

        {tab === 'artilharia' && (
          <section>
            <h2 className="mb-1 text-2xl font-black">ARTILHARIA</h2>
            <p className="mb-4 text-sm text-ink-500">Ranking de goleadores do campeonato, atualizado a cada gol lançado.</p>
            {scorers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-sm text-ink-400">
                Nenhum gol registrado ainda.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
                {scorers.map((scorer, index) => (
                  <div
                    key={scorer.playerId}
                    className={`flex items-center justify-between gap-3 px-5 py-3.5 ${index % 2 === 0 ? 'bg-white' : 'bg-ink-50/60'} ${index < 3 ? 'bg-gold-400/5' : ''}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-8 shrink-0 text-center text-sm font-black text-ink-400">{index + 1}º</span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink-900">{scorer.playerName}</p>
                        <p className="truncate text-xs text-ink-500">{scorer.teamName}</p>
                      </div>
                    </div>
                    <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1 text-sm font-black text-white">
                      <GoalIcon size={13} /> {scorer.goals}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'historico' && (
          <section>
            <h2 className="mb-1 text-2xl font-black">HISTÓRICO DE PARTIDAS</h2>
            <p className="mb-4 text-sm text-ink-500">Partidas já realizadas. Toque em uma para ver gols e cartões detalhados.</p>
            {completed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-sm text-ink-400">
                Nenhuma partida foi encerrada ainda.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {completed.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teamAName={teamName(match.teamAId)}
                    teamBName={teamName(match.teamBId)}
                    teamAShield={teamShield(match.teamAId)}
                    teamBShield={teamShield(match.teamBId)}
                    onClick={() => setSelected(match)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'criterios' && <CriteriaCard />}

        {/* Situação disciplinar — sempre visível */}
        <section className="mt-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black"><Ban size={17} className="text-red-600" /> JOGADORES SUSPENSOS</h2>
            <p className="mt-1 text-sm text-ink-500">Suspensão informada pela organização após cartão vermelho.</p>
            <div className="mt-4 space-y-2">
              {disciplinary.filter((p) => p.suspensionMatches > 0).map((p) => (
                <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2 text-sm" key={p.playerId}>
                  <span><b>{p.playerName}</b> · {p.teamName}</span>
                  <span className="font-bold text-red-700">{p.suspensionMatches} jogo(s)</span>
                </div>
              ))}
              {!disciplinary.some((p) => p.suspensionMatches > 0) && <p className="text-sm text-ink-400">Nenhum jogador suspenso.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-lg font-black"><SquareIcon size={15} className="fill-amber-400 text-amber-500" /> JOGADORES PENDURADOS</h2>
            <p className="mt-1 text-sm text-ink-500">Dois cartões amarelos acumulados no campeonato.</p>
            <div className="mt-4 space-y-2">
              {disciplinary.filter((p) => p.yellowCards >= 2).map((p) => (
                <div className="flex justify-between rounded-lg bg-amber-50 px-3 py-2 text-sm" key={p.playerId}>
                  <span><b>{p.playerName}</b> · {p.teamName}</span>
                  <span className="font-bold text-amber-700">{p.yellowCards} amarelos</span>
                </div>
              ))}
              {!disciplinary.some((p) => p.yellowCards >= 2) && <p className="text-sm text-ink-400">Nenhum jogador pendurado.</p>}
            </div>
          </div>
        </section>
      </div>

      <MatchModal
        match={selected}
        teamAName={teamName(selected?.teamAId ?? null)}
        teamBName={teamName(selected?.teamBId ?? null)}
        teamAShield={teamShield(selected?.teamAId ?? null)}
        teamBShield={teamShield(selected?.teamBId ?? null)}
        goals={details?.goals ?? []}
        cards={details?.cards ?? []}
        onClose={() => setSelected(null)}
      />
    </PublicSidebar>
  )
}
