import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import clsx from 'clsx'
import { X, Goal, Square, Clock, CalendarDays } from 'lucide-react'
import { TeamShield } from './TeamBadge'
import type { Match } from '../../types'
import type { PublicEvent } from '../../data/matches'

const STATUS_LABEL: Record<Match['status'], string> = {
  NAO_INICIADO: 'AGENDADO',
  EM_ANDAMENTO: 'AO VIVO',
  ENCERRADO: 'FINALIZADO',
  WO: 'ENCERRADO POR W.O.',
  CANCELADO: 'CANCELADO',
}

export function MatchModal({
  match,
  teamAName,
  teamBName,
  teamAShield,
  teamBShield,
  goals,
  cards,
  onClose,
}: {
  match: Match | null
  teamAName: string
  teamBName: string
  teamAShield?: string | null
  teamBShield?: string | null
  goals: PublicEvent[]
  cards: PublicEvent[]
  onClose: () => void
}) {
  useEffect(() => {
    if (!match) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [match, onClose])

  if (!match) return null

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-ink-950/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho com placar */}
        <div className="relative bg-[linear-gradient(135deg,#020816,#062b68)] px-6 pb-7 pt-5 text-white">
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X size={16} />
          </button>
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold">
            <span className="rounded bg-white/10 px-2 py-1">{match.matchNumber}</span>
            <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-gold-400">{STATUS_LABEL[match.status]}</span>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <TeamShield name={teamAName} shieldUrl={teamAShield} size="lg" />
              <span className="text-xs font-bold leading-tight">{teamAName}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 rounded-2xl bg-black/25 px-4 py-2 text-3xl font-black tabular-nums">
              <span>{match.goalsA}</span>
              <span className="text-lg text-blue-200">×</span>
              <span>{match.goalsB}</span>
            </div>
            <div className="flex flex-1 flex-col items-center gap-2 text-center">
              <TeamShield name={teamBName} shieldUrl={teamBShield} size="lg" />
              <span className="text-xs font-bold leading-tight">{teamBName}</span>
            </div>
          </div>

          {match.hadPenalties && (
            <p className="mt-3 text-center text-xs font-semibold text-blue-100">Pênaltis: {match.penaltiesA} × {match.penaltiesB}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-blue-100">
            <span className="flex items-center gap-1"><CalendarDays size={13} /> {match.date ?? 'Data a definir'}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {match.time ?? '—'}</span>
          </div>
        </div>

        {/* Gols e cartões */}
        <div className="grid gap-5 p-6 sm:grid-cols-2">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-ink-500">
              <Goal size={15} className="text-brand-600" /> Gols
            </h3>
            <div className="mt-2.5 space-y-1.5">
              {goals.length ? (
                goals.map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
                    <span className="truncate font-semibold text-ink-900">{event.playerName}</span>
                    <span className="shrink-0 text-xs text-ink-400">{event.teamName} · {event.minute}'</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-400">Nenhum gol detalhado.</p>
              )}
            </div>
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-ink-500">
              <Square size={13} className="fill-amber-400 text-amber-500" /> Cartões
            </h3>
            <div className="mt-2.5 space-y-1.5">
              {cards.length ? (
                cards.map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <Square size={12} className={clsx(event.cardType === 'VERMELHO' ? 'fill-red-600 text-red-700' : 'fill-amber-400 text-amber-500')} />
                      <span className="truncate font-semibold text-ink-900">{event.playerName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-ink-400">
                      {event.minute}'{event.suspensionMatches ? ` · ${event.suspensionMatches}j susp.` : ''}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-400">Nenhum cartão detalhado.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
