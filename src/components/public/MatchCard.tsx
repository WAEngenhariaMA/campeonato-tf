import clsx from 'clsx'
import { Clock } from 'lucide-react'
import { TeamShield } from './TeamBadge'
import type { Match } from '../../types'

const STATUS_LABEL: Record<Match['status'], string> = {
  NAO_INICIADO: 'AGENDADO',
  EM_ANDAMENTO: 'AO VIVO',
  ENCERRADO: 'FINALIZADO',
  WO: 'W.O.',
  CANCELADO: 'CANCELADO',
}
const STATUS_TONE: Record<Match['status'], string> = {
  NAO_INICIADO: 'bg-ink-100 text-ink-500',
  EM_ANDAMENTO: 'bg-red-100 text-red-700 animate-pulse',
  ENCERRADO: 'bg-emerald-100 text-emerald-700',
  WO: 'bg-amber-100 text-amber-700',
  CANCELADO: 'bg-ink-100 text-ink-400',
}

/** Card compacto de confronto — mesma altura/padding em qualquer lugar que apareça (lista, bracket). */
export function MatchCard({
  match,
  teamAName,
  teamBName,
  teamAShield,
  teamBShield,
  onClick,
  compact = false,
}: {
  match: Match
  teamAName: string
  teamBName: string
  teamAShield?: string | null
  teamBShield?: string | null
  onClick?: () => void
  compact?: boolean
}) {
  const played = match.status === 'ENCERRADO' || match.status === 'WO'

  return (
    <button
      onClick={onClick}
      className={clsx(
        'group flex w-full flex-col gap-2 rounded-xl border border-ink-100 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md',
        compact ? 'p-2.5' : 'p-3',
      )}
    >
      <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-ink-400">
        <span className="rounded bg-ink-100 px-1.5 py-0.5">{match.matchNumber}</span>
        <span className={clsx('rounded-full px-2 py-0.5', STATUS_TONE[match.status])}>{STATUS_LABEL[match.status]}</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <TeamShield name={teamAName} shieldUrl={teamAShield} size={compact ? 'xs' : 'sm'} />
          <span className="truncate text-xs font-bold text-ink-900">{teamAName}</span>
        </span>
        <span className={clsx('shrink-0 text-sm font-black tabular-nums', played ? 'text-ink-900' : 'text-ink-300')}>{match.goalsA}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <TeamShield name={teamBName} shieldUrl={teamBShield} size={compact ? 'xs' : 'sm'} />
          <span className="truncate text-xs font-bold text-ink-900">{teamBName}</span>
        </span>
        <span className={clsx('shrink-0 text-sm font-black tabular-nums', played ? 'text-ink-900' : 'text-ink-300')}>{match.goalsB}</span>
      </div>

      {!compact && (
        <div className="flex items-center gap-1.5 border-t border-ink-50 pt-2 text-[11px] text-ink-400">
          <Clock size={12} />
          <span>{match.date ?? 'Data a definir'} {match.time ?? ''}</span>
        </div>
      )}
    </button>
  )
}
