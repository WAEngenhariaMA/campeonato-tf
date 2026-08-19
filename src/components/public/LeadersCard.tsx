import { Target, TrendingUp, ShieldCheck, CircleCheck } from 'lucide-react'
import { TeamBadge } from './TeamBadge'
import type { Standing, Team } from '../../types'
import type { Scorer } from '../../data/matches'

function Row({ icon: Icon, label, name, shieldUrl, value }: { icon: typeof Target; label: string; name: string; shieldUrl?: string | null; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3 py-2.5">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-sm">
          <Icon size={16} />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400">{label}</span>
          <TeamBadge name={name} shieldUrl={shieldUrl} size="xs" className="text-xs" />
        </span>
      </span>
      <span className="shrink-0 text-sm font-black text-ink-900">{value}</span>
    </div>
  )
}

export function LeadersCard({ standings, teamsById, topScorer }: { standings: Standing[]; teamsById: Map<string, Team>; topScorer: Scorer | null }) {
  const withGames = standings.filter((s) => s.games > 0)
  const bestAttack = [...withGames].sort((a, b) => b.goalsFor - a.goalsFor)[0]
  const bestDefense = [...withGames].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0]
  const fairPlay = [...withGames].sort((a, b) => (a.yellowCards + a.redCards) - (b.yellowCards + b.redCards))[0]

  const hasAny = topScorer || bestAttack || bestDefense || fairPlay

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-black uppercase tracking-wide text-ink-500">🏅 Líderes</h2>
      <div className="mt-3 space-y-2">
        {topScorer && <Row icon={Target} label="Artilheiro" name={topScorer.playerName} shieldUrl={teamsById.get(topScorer.teamId)?.shieldUrl} value={`${topScorer.goals} gols`} />}
        {bestAttack && <Row icon={TrendingUp} label="Melhor ataque" name={bestAttack.teamName} shieldUrl={teamsById.get(bestAttack.teamId)?.shieldUrl} value={`${bestAttack.goalsFor} GP`} />}
        {bestDefense && <Row icon={ShieldCheck} label="Melhor defesa" name={bestDefense.teamName} shieldUrl={teamsById.get(bestDefense.teamId)?.shieldUrl} value={`${bestDefense.goalsAgainst} GC`} />}
        {fairPlay && <Row icon={CircleCheck} label="Fair play" name={fairPlay.teamName} shieldUrl={teamsById.get(fairPlay.teamId)?.shieldUrl} value={`${fairPlay.yellowCards + fairPlay.redCards} cartões`} />}
        {!hasAny && <p className="text-sm text-ink-400">Os destaques aparecem aqui após os primeiros jogos.</p>}
      </div>
    </div>
  )
}
