import clsx from 'clsx'
import { TeamBadge } from './TeamBadge'
import type { Standing, Team } from '../../types'

const situationTone = (s: string) =>
  s === 'SEMIFINAL' ? 'bg-emerald-100 text-emerald-800'
  : s === 'PLAYOFF' ? 'bg-amber-100 text-amber-800'
  : s === 'MELHOR PERDEDOR' ? 'bg-blue-100 text-blue-800'
  : s === 'ELIMINADO' ? 'bg-red-100 text-red-800'
  : 'bg-slate-100 text-slate-600'

const POSITION_STYLE = [
  'bg-gold-400 text-pitch-950',
  'bg-slate-300 text-pitch-950',
  'bg-amber-700/80 text-white',
] as const

function PositionBadge({ position }: { position: number }) {
  const style = POSITION_STYLE[position - 1]
  return (
    <span
      className={clsx(
        'flex h-7 w-7 items-center justify-center rounded-full text-xs font-black',
        style ?? 'bg-ink-100 text-ink-500',
      )}
    >
      {position}
    </span>
  )
}

const COLS = ['POS', 'TIME', 'J', 'V', 'D', 'SG', 'GP', 'GC', 'CV', 'CA', 'SITUAÇÃO'] as const

export function StandingsTable({ standings, teamsById }: { standings: Standing[]; teamsById: Map<string, Team> }) {
  if (standings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-10 text-center text-sm text-ink-400">
        A classificação aparece aqui assim que o primeiro resultado for confirmado.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-sm">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="bg-ink-50 text-xs text-ink-500">
          <tr>
            {COLS.map((head) => (
              <th className="px-3 py-3 text-left font-bold" key={head}>{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((team) => (
            <tr className={clsx('border-t border-ink-100', team.position <= 3 && 'bg-gold-400/5')} key={team.teamId}>
              <td className="px-3 py-3"><PositionBadge position={team.position} /></td>
              <td className="px-3 py-3">
                <TeamBadge name={team.teamName} shieldUrl={teamsById.get(team.teamId)?.shieldUrl} size="sm" />
              </td>
              <td className="px-3 py-3 tabular-nums">{team.games}</td>
              <td className="px-3 py-3 tabular-nums">{team.wins}</td>
              <td className="px-3 py-3 tabular-nums">{team.losses}</td>
              <td className={clsx('px-3 py-3 font-bold tabular-nums', team.goalDifference > 0 ? 'text-emerald-600' : team.goalDifference < 0 ? 'text-red-600' : 'text-ink-500')}>
                {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
              </td>
              <td className="px-3 py-3 tabular-nums">{team.goalsFor}</td>
              <td className="px-3 py-3 tabular-nums">{team.goalsAgainst}</td>
              <td className="px-3 py-3 tabular-nums">{team.redCards}</td>
              <td className="px-3 py-3 tabular-nums">{team.yellowCards}</td>
              <td className="px-3 py-3"><span className={clsx('rounded-full px-2 py-1 text-xs font-bold', situationTone(team.situation))}>{team.situation}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
