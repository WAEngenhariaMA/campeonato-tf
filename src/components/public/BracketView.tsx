import { Trophy, Medal, ChevronRight } from 'lucide-react'
import { MatchCard } from './MatchCard'
import type { Match, Team } from '../../types'

function teamName(id: string | null, teamsById: Map<string, Team>) {
  return id ? (teamsById.get(id)?.name ?? 'A DEFINIR') : 'A DEFINIR'
}
function teamShield(id: string | null, teamsById: Map<string, Team>) {
  return id ? teamsById.get(id)?.shieldUrl : null
}

function Column({
  title,
  caption,
  matches,
  teamsById,
  onSelect,
  className = '',
}: {
  title: string
  caption?: string
  matches: Match[]
  teamsById: Map<string, Team>
  onSelect: (match: Match) => void
  className?: string
}) {
  return (
    <div className={`flex w-60 shrink-0 flex-col gap-3 ${className}`}>
      <div>
        <h3 className="text-xs font-black tracking-wider text-brand-700">{title}</h3>
        {caption && <p className="mt-0.5 text-[11px] leading-snug text-ink-400">{caption}</p>}
      </div>
      <div className="flex flex-1 flex-col justify-around gap-3">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            teamAName={teamName(match.teamAId, teamsById)}
            teamBName={teamName(match.teamBId, teamsById)}
            teamAShield={teamShield(match.teamAId, teamsById)}
            teamBShield={teamShield(match.teamBId, teamsById)}
            compact
            onClick={() => onSelect(match)}
          />
        ))}
        {matches.length === 0 && (
          <p className="rounded-xl border border-dashed border-ink-200 p-3 text-center text-xs text-ink-400">A definir</p>
        )}
      </div>
    </div>
  )
}

/** Divisor "de fluxo": usado onde o avanço não é um cruzamento direto de chave (é por ranking),
 * então a linha é só indicativa — não finge ligar uma partida específica à outra. */
function FlowDivider() {
  return (
    <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-1 self-stretch text-ink-300">
      <div className="h-full w-px bg-gradient-to-b from-transparent via-ink-200 to-transparent" />
      <ChevronRight size={16} className="absolute" />
    </div>
  )
}

/** Cruzamento real de chave (2 semifinais convergindo para 1 final) — aqui sim a ligação é exata. */
function BracketConnector() {
  return (
    <div className="relative w-8 shrink-0 self-stretch">
      <span className="absolute left-0 top-[25%] h-[50%] w-full rounded-tr-xl rounded-br-xl border-r-2 border-t-2 border-b-2 border-ink-200" />
    </div>
  )
}

export function BracketView({
  matches,
  teamsById,
  onSelect,
}: {
  matches: Match[]
  teamsById: Map<string, Team>
  onSelect: (match: Match) => void
}) {
  const byPhase = (phase: Match['phase']) => matches.filter((m) => m.phase === phase)
  const primeira = byPhase('PRIMEIRA_FASE')
  const playoff = byPhase('PLAYOFF')
  const semi = byPhase('SEMIFINAL')
  const final = byPhase('FINAL')
  const terceiro = byPhase('TERCEIRO_LUGAR')

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex min-w-max items-stretch gap-0 px-1">
        <Column
          title="PRIMEIRA FASE"
          caption="5 jogos. Os 2 melhores vencedores avançam direto à semifinal."
          matches={primeira}
          teamsById={teamsById}
          onSelect={onSelect}
        />
        <FlowDivider />
        <Column
          title="PLAYOFF"
          caption="3º, 4º e 5º melhores vencedores + melhor perdedor disputam 2 vagas."
          matches={playoff}
          teamsById={teamsById}
          onSelect={onSelect}
        />
        <FlowDivider />
        <Column title="SEMIFINAIS" matches={semi} teamsById={teamsById} onSelect={onSelect} />
        <BracketConnector />

        {/* Final + 3º lugar */}
        <div className="flex w-60 shrink-0 flex-col justify-center gap-4">
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-xs font-black tracking-wider text-gold-500">
              <Trophy size={15} /> GRANDE FINAL
            </div>
            {final.length ? (
              <MatchCard
                match={final[0]}
                teamAName={teamName(final[0].teamAId, teamsById)}
                teamBName={teamName(final[0].teamBId, teamsById)}
                teamAShield={teamShield(final[0].teamAId, teamsById)}
                teamBShield={teamShield(final[0].teamBId, teamsById)}
                onClick={() => onSelect(final[0])}
                compact
              />
            ) : (
              <p className="rounded-xl border border-dashed border-gold-400/40 p-3 text-center text-xs text-ink-400">A definir</p>
            )}
          </div>

          <div className="opacity-80">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-amber-700">
              <Medal size={13} /> DISPUTA DE 3º LUGAR
            </div>
            {terceiro.length ? (
              <MatchCard
                match={terceiro[0]}
                teamAName={teamName(terceiro[0].teamAId, teamsById)}
                teamBName={teamName(terceiro[0].teamBId, teamsById)}
                teamAShield={teamShield(terceiro[0].teamAId, teamsById)}
                teamBShield={teamShield(terceiro[0].teamBId, teamsById)}
                onClick={() => onSelect(terceiro[0])}
                compact
              />
            ) : (
              <p className="rounded-xl border border-dashed border-ink-200 p-2.5 text-center text-[11px] text-ink-400">A definir</p>
            )}
            <p className="mt-1.5 text-[10px] text-ink-400">Disputada pelos dois perdedores das semifinais.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
