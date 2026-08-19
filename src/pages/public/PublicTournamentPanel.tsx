import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Modal } from '../../components/ui/Modal'
import { TeamTag } from '../../components/public/TeamTag'
import { getTournament, type MatchHistory } from '../../data/matches'
import { subscribeTeams } from '../../data/teams'
import type { Match, Standing, Team } from '../../types'
import { resolveChampionshipLogo } from '../../lib/branding'
import { DEFAULT_CONFIG, subscribeConfig } from '../../data/config'
import type { ChampionshipConfig } from '../../types'

const PHASES = [
  ['PRIMEIRA_FASE', 'PRIMEIRA FASE'],
  ['PLAYOFF', 'PLAYOFF'],
  ['SEMIFINAL', 'SEMIFINAIS'],
  ['TERCEIRO_LUGAR', '3º LUGAR'],
  ['FINAL', 'GRANDE FINAL'],
] as const

const situationTone = (s: string) =>
  s === 'SEMIFINAL' ? 'bg-emerald-100 text-emerald-800'
  : s === 'PLAYOFF' ? 'bg-amber-100 text-amber-800'
  : s === 'MELHOR PERDEDOR' ? 'bg-blue-100 text-blue-800'
  : s === 'ELIMINADO' ? 'bg-red-100 text-red-800'
  : 'bg-slate-100 text-slate-600'

const MEDAL = ['🥇', '🥈', '🥉'] as const

type TabKey = 'classificacao' | 'jogos' | 'artilharia' | 'historico' | 'criterios'
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'classificacao', label: 'Classificação', icon: '📊' },
  { key: 'jogos', label: 'Jogos', icon: '⚽' },
  { key: 'artilharia', label: 'Artilharia', icon: '🎯' },
  { key: 'historico', label: 'Histórico', icon: '🕒' },
  { key: 'criterios', label: 'Critérios', icon: '📐' },
]

type Scorer = { playerId: string; playerName: string; teamId: string; teamName: string; goals: number }

function buildScorers(history: MatchHistory[]): Scorer[] {
  const byPlayer = new Map<string, Scorer>()
  for (const match of history) {
    for (const goal of match.goals) {
      const existing = byPlayer.get(goal.playerId)
      if (existing) existing.goals += 1
      else byPlayer.set(goal.playerId, { playerId: goal.playerId, playerName: goal.playerName, teamId: goal.teamId, teamName: goal.teamName, goals: 1 })
    }
  }
  return [...byPlayer.values()].sort((a, b) => b.goals - a.goals || a.playerName.localeCompare(b.playerName))
}

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

  return (
    <div className="min-h-svh bg-[#f4f7fc] text-ink-900">
      <header className="bg-[linear-gradient(125deg,#020816,#062b68)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <Link className="flex items-center gap-3" to="/">
            <img src={resolveChampionshipLogo(config.logoUrl)} className="h-11 w-11 rounded-xl object-cover" alt="" />
            <span className="font-black tracking-tight">{config.name}</span>
          </Link>
          <Link to="/" className="text-sm font-bold text-gold-400">
            ← INÍCIO
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-5 pb-9 pt-7">
          <p className="text-xs font-bold tracking-[.2em] text-gold-400">PAINEL OFICIAL • ATUALIZAÇÃO AO VIVO</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">CENTRAL DO CAMPEONATO</h1>
          <p className="mt-2 text-blue-100">Classificação, jogos, artilharia, histórico e critérios — tudo em um só lugar.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <b className="text-xl">{completed.length}/11</b>
              <span className="ml-2 text-sm text-blue-100">jogos realizados</span>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <b className="text-xl">{standings.length}</b>
              <span className="ml-2 text-sm text-blue-100">equipes</span>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-3">
              <b className="text-xl">{scorers.reduce((sum, s) => sum + s.goals, 0)}</b>
              <span className="ml-2 text-sm text-blue-100">gols marcados</span>
            </div>
          </div>
        </div>
      </header>

      {/* Barra de abas */}
      <div className="sticky top-0 z-20 border-b border-ink-100 bg-white/95 shadow-sm backdrop-blur">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5">
          {TABS.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-bold transition-colors ${
                tab === item.key
                  ? 'border-gold-500 text-brand-700'
                  : 'border-transparent text-ink-400 hover:text-ink-700'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        {tab === 'classificacao' && (
          <section>
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black">CLASSIFICAÇÃO</h2>
                <p className="text-sm text-ink-500">Critérios: vitórias, saldo de gols, gols pró, gols contra, menos vermelhos e menos amarelos.</p>
              </div>
              <span className="text-xs text-ink-400">SG saldo · GP pró · GC contra · CV vermelho · CA amarelo</span>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-sm">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-ink-50 text-xs text-ink-500">
                  <tr>
                    {['POS', 'TIME', 'J', 'V', 'D', 'SG', 'GP', 'GC', 'CV', 'CA', 'SITUAÇÃO'].map((head) => (
                      <th className="px-3 py-3 text-left" key={head}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((team) => (
                    <tr className={`border-t border-ink-100 ${team.position <= 3 ? 'bg-gold-400/5' : ''}`} key={team.teamId}>
                      <td className="px-3 py-3 font-black">{MEDAL[team.position - 1] ?? `${team.position}º`}</td>
                      <td className="px-3 py-3"><TeamTag name={team.teamName} shieldUrl={teamShield(team.teamId)} /></td>
                      <td className="px-3 py-3">{team.games}</td>
                      <td className="px-3 py-3">{team.wins}</td>
                      <td className="px-3 py-3">{team.losses}</td>
                      <td className="px-3 py-3 font-bold">{team.goalDifference}</td>
                      <td className="px-3 py-3">{team.goalsFor}</td>
                      <td className="px-3 py-3">{team.goalsAgainst}</td>
                      <td className="px-3 py-3">{team.redCards}</td>
                      <td className="px-3 py-3">{team.yellowCards}</td>
                      <td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${situationTone(team.situation)}`}>{team.situation}</span></td>
                    </tr>
                  ))}
                  {standings.length === 0 && (
                    <tr><td colSpan={11} className="px-3 py-10 text-center text-sm text-ink-400">A classificação aparece aqui assim que o primeiro resultado for confirmado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === 'jogos' && (
          <section>
            <h2 className="mb-3 text-2xl font-black">JOGOS E FASES</h2>
            <div className="grid gap-4 lg:grid-cols-5">
              {PHASES.map(([phase, title]) => (
                <div key={phase}>
                  <h3 className="mb-2 text-xs font-black tracking-wider text-brand-700">{title}</h3>
                  <div className="space-y-2">
                    {matches.filter((match) => match.phase === phase).map((match) => (
                      <button
                        onClick={() => setSelected(match)}
                        className="w-full rounded-xl border border-ink-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400"
                        key={match.id}
                      >
                        <div className="flex justify-between text-xs font-bold text-ink-500">
                          <span>{match.matchNumber}</span>
                          <span>{match.date ?? 'A definir'} {match.time ?? ''}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-sm font-bold">
                          <TeamTag name={teamName(match.teamAId)} shieldUrl={teamShield(match.teamAId)} size="sm" />
                          <b>{match.goalsA}</b>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2 text-sm font-bold">
                          <TeamTag name={teamName(match.teamBId)} shieldUrl={teamShield(match.teamBId)} size="sm" />
                          <b>{match.goalsB}</b>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-brand-600">VER HISTÓRICO →</p>
                      </button>
                    ))}
                    {matches.filter((match) => match.phase === phase).length === 0 && (
                      <p className="rounded-xl border border-dashed border-ink-200 p-3 text-center text-xs text-ink-400">Ainda não definido</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                      <span className="w-8 shrink-0 text-center text-lg font-black text-ink-400">{MEDAL[index] ?? index + 1}</span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink-900">{scorer.playerName}</p>
                        <TeamTag name={scorer.teamName} shieldUrl={teamShield(scorer.teamId)} size="sm" bold={false} className="text-xs text-ink-500" />
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-600 px-3 py-1 text-sm font-black text-white">
                      {scorer.goals} {scorer.goals === 1 ? 'GOL' : 'GOLS'}
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
              <div className="space-y-2">
                {completed.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setSelected(match)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-ink-400">
                      <span className="rounded bg-ink-100 px-2 py-0.5">{match.matchNumber}</span>
                      <span>{match.date ?? 'Data a definir'}</span>
                      {match.status === 'WO' && <span className="rounded bg-red-100 px-2 py-0.5 text-red-700">W.O.</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold">
                      <TeamTag name={teamName(match.teamAId)} shieldUrl={teamShield(match.teamAId)} size="sm" />
                      <span className="rounded-lg bg-pitch-950 px-2.5 py-1 text-white">{match.goalsA} × {match.goalsB}</span>
                      <TeamTag name={teamName(match.teamBId)} shieldUrl={teamShield(match.teamBId)} size="sm" />
                    </div>
                    {match.hadPenalties && (
                      <span className="text-xs font-semibold text-ink-500">Pênaltis {match.penaltiesA} × {match.penaltiesB}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'criterios' && (
          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">📊 CLASSIFICAÇÃO GERAL</h2>
              <p className="mt-1 text-sm text-ink-500">Ordem de critérios usada para desempatar times na tabela.</p>
              <ol className="mt-4 space-y-2.5 text-sm">
                {['Maior saldo de gols', 'Maior número de gols marcados (pró)', 'Menor número de gols sofridos (contra)', 'Menor número de cartões vermelhos', 'Menor número de cartões amarelos', 'Sorteio administrativo em caso de igualdade absoluta'].map((rule, i) => (
                  <li key={rule} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-black text-brand-700">{i + 1}</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black">🏆 REGRAS DO MATA-MATA</h2>
              <p className="mt-1 text-sm text-ink-500">Como vencedores e o melhor perdedor da primeira fase são ranqueados.</p>
              <ol className="mt-4 space-y-2.5 text-sm">
                {['Vitória no tempo normal tem vantagem sobre vitória nos pênaltis', 'Derrota somente nos pênaltis tem vantagem sobre derrota no tempo normal (melhor perdedor)', 'Maior saldo de gols no tempo normal', 'Maior número de gols marcados', 'Menor número de gols sofridos', 'Menor número de cartões vermelhos e amarelos', 'Sorteio da organização em igualdade absoluta'].map((rule, i) => (
                  <li key={rule} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-xs font-black text-gold-500">{i + 1}</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                ⚠️ Gols marcados na disputa de pênaltis não entram no saldo de gols nem nas estatísticas da classificação.
              </p>
            </div>
          </section>
        )}

        {/* Situação disciplinar — sempre visível, faz parte do painel geral */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black">🚫 JOGADORES SUSPENSOS</h2>
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
            <h2 className="text-xl font-black">🟨 JOGADORES PENDURADOS</h2>
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
      </main>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.matchNumber} — Histórico da partida` : 'Histórico'}
      >
        <div className="space-y-4">
          <p className="font-bold">
            {selected && `${teamName(selected.teamAId)} ${selected.goalsA} × ${selected.goalsB} ${teamName(selected.teamBId)}`}
          </p>
          <div>
            <h3 className="text-sm font-black">GOLS</h3>
            {details?.goals.length
              ? details.goals.map((event) => <p className="mt-1 text-sm" key={event.id}>⚽ {event.playerName} ({event.teamName}) — {event.minute}'</p>)
              : <p className="mt-1 text-sm text-ink-400">Nenhum gol detalhado.</p>}
          </div>
          <div>
            <h3 className="text-sm font-black">CARTÕES</h3>
            {details?.cards.length
              ? details.cards.map((event) => (
                  <p className="mt-1 text-sm" key={event.id}>
                    {event.cardType === 'VERMELHO' ? '🟥' : '🟨'} {event.playerName} ({event.teamName}) — {event.minute}'
                    {event.suspensionMatches ? ` · ${event.suspensionMatches} jogo(s) de suspensão` : ''}
                  </p>
                ))
              : <p className="mt-1 text-sm text-ink-400">Nenhum cartão detalhado.</p>}
          </div>
        </div>
      </Modal>
    </div>
  )
}
