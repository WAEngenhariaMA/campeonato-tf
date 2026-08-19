import { useEffect, useMemo, useRef, useState } from 'react'
import { Shuffle, PartyPopper, RotateCcw, Trophy, Users, Dices, CalendarClock, Lock } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { TeamShield } from '../../components/public/TeamBadge'
import { subscribeTeams } from '../../data/teams'
import { subscribeMatches, createOfficialSchedule, updateMatch } from '../../data/matches'
import { subscribeConfig, DEFAULT_CONFIG } from '../../data/config'
import { formatDate } from '../../lib/format'
import type { Match, Team, ChampionshipConfig } from '../../types'

function shuffle<T>(list: T[]): T[] {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const byMatchNumber = (a: Match, b: Match) => Number(a.matchNumber.slice(1)) - Number(b.matchNumber.slice(1))

export default function AdminDraw() {
  const toast = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [generating, setGenerating] = useState(false)

  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => subscribeMatches(setMatches), [])
  useEffect(() => subscribeConfig(setConfig), [])

  const firstPhase = useMemo(
    () => matches.filter((m) => m.phase === 'PRIMEIRA_FASE').sort(byMatchNumber),
    [matches],
  )
  const scheduleReady = firstPhase.length === 5
  const activeTeams = useMemo(() => teams.filter((t) => t.active), [teams])
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const readyToDraw = activeTeams.length === config.teamCount
  const alreadyDrawn = scheduleReady && firstPhase.every((m) => m.teamAId && m.teamBId)
  const lockedByResults = firstPhase.some((m) => m.status !== 'NAO_INICIADO')

  // ---- estado da cerimônia ----
  const [phase, setPhase] = useState<'idle' | 'drawing' | 'summary'>('idle')
  const orderRef = useRef<string[]>([])
  const [revealed, setRevealed] = useState<(string | null)[]>(Array(10).fill(null))
  const [shuffling, setShuffling] = useState(false)
  const [flashTeamId, setFlashTeamId] = useState<string | null>(null)
  const [justPaired, setJustPaired] = useState(false)
  const [redoConfirm, setRedoConfirm] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const shuffleTimer = useRef<number | null>(null)

  useEffect(() => () => { if (shuffleTimer.current) window.clearInterval(shuffleTimer.current) }, [])

  async function generateSchedule() {
    setGenerating(true)
    try {
      await createOfficialSchedule()
      toast.success('Calendário oficial gerado.')
    } catch {
      toast.error('Não foi possível gerar o calendário.')
    } finally {
      setGenerating(false)
    }
  }

  function startDraw() {
    orderRef.current = shuffle(activeTeams.map((t) => t.id))
    setRevealed(Array(10).fill(null))
    setJustPaired(false)
    setPhase('drawing')
  }

  const nextIndex = revealed.findIndex((v) => v === null)
  const currentMatch = nextIndex >= 0 ? firstPhase[Math.floor(nextIndex / 2)] : null
  const isSlotA = nextIndex % 2 === 0
  const remainingTeams = activeTeams.filter((t) => !revealed.includes(t.id))

  function drawNext() {
    if (nextIndex < 0 || shuffling) return
    setShuffling(true)
    const pool = remainingTeams
    // Duração por relógio (não por número de "ticks"): se o admin trocar de aba durante o
    // sorteio, o navegador limita bastante o setInterval em segundo plano — contar ticks
    // faria a animação travar por minutos. Checando o tempo já decorrido, assim que a aba
    // volta a ficar visível o próximo tick já resolve a revelação de uma vez.
    const startedAt = Date.now()
    const duration = 1450 + Math.random() * 550
    shuffleTimer.current = window.setInterval(() => {
      setFlashTeamId(pool[Math.floor(Math.random() * pool.length)]?.id ?? null)
      if (Date.now() - startedAt >= duration) {
        if (shuffleTimer.current) window.clearInterval(shuffleTimer.current)
        const result = orderRef.current[nextIndex]
        setFlashTeamId(result)
        setShuffling(false)
        setRevealed((prev) => {
          const next = [...prev]
          next[nextIndex] = result
          return next
        })
        if (nextIndex % 2 === 1) setJustPaired(true)
      }
    }, 90)
  }

  function continueAfterPair() {
    setJustPaired(false)
    if (revealed.every((v) => v !== null)) setPhase('summary')
  }

  function discardDraw() {
    setPhase('idle')
    setRevealed(Array(10).fill(null))
  }

  async function confirmDraw() {
    setConfirming(true)
    try {
      for (let i = 0; i < firstPhase.length; i++) {
        await updateMatch(firstPhase[i].id, { teamAId: revealed[i * 2], teamBId: revealed[i * 2 + 1] })
      }
      toast.success('Sorteio confirmado! Os confrontos da primeira fase foram salvos.')
      setPhase('idle')
    } catch {
      toast.error('Não foi possível salvar o sorteio.')
    } finally {
      setConfirming(false)
    }
  }

  async function handleRedo() {
    try {
      for (const match of firstPhase) {
        await updateMatch(match.id, { teamAId: null, teamBId: null })
      }
      toast.success('Sorteio anulado. Você pode sortear novamente.')
      setRedoConfirm(false)
    } catch {
      toast.error('Não foi possível anular o sorteio.')
    }
  }

  return (
    <div>
      <PageHeader title="SORTEIO OFICIAL" subtitle="Define aleatoriamente os confrontos J1 a J5 da primeira fase." />

      {!scheduleReady ? (
        <Card className="p-8 text-center">
          <CalendarClock className="mx-auto text-ink-300" size={32} />
          <p className="mt-3 font-semibold text-pitch-950">O calendário oficial ainda não foi criado.</p>
          <p className="mt-1 text-sm text-ink-500">É preciso gerar J1 a J11 (datas e horários oficiais) antes de sortear os confrontos.</p>
          <Button className="mt-4" onClick={generateSchedule} loading={generating}>
            GERAR CALENDÁRIO OFICIAL
          </Button>
        </Card>
      ) : phase === 'idle' && !readyToDraw ? (
        <Card className="p-8 text-center">
          <Users className="mx-auto text-ink-300" size={32} />
          <p className="mt-3 font-semibold text-pitch-950">Aguardando o cadastro das equipes</p>
          <p className="mt-1 text-sm text-ink-500">
            O sorteio precisa de exatamente {config.teamCount} times ativos para preencher as 5 partidas.
          </p>
          <p className="mt-3 text-2xl font-black text-brand-600">{activeTeams.length} / {config.teamCount}</p>
        </Card>
      ) : phase === 'idle' && alreadyDrawn ? (
        <div>
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-bold text-pitch-950">
                <Lock size={16} className="text-emerald-600" /> Sorteio já realizado
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRedoConfirm(true)}
                disabled={lockedByResults}
                title={lockedByResults ? 'Já existe resultado/súmula lançada — não é possível refazer.' : undefined}
              >
                <RotateCcw size={14} className="mr-1.5 inline" /> REFAZER SORTEIO
              </Button>
            </div>
            {lockedByResults && (
              <p className="mt-2 text-xs text-amber-700">
                Um ou mais jogos já têm resultado lançado. Anule o resultado antes de refazer o sorteio.
              </p>
            )}
          </Card>
          <DrawSummaryGrid matches={firstPhase} teamById={teamById} className="mt-4" />
        </div>
      ) : phase === 'idle' ? (
        <div>
          <Card className="mb-5 p-6 text-center">
            <Dices className="mx-auto text-brand-600" size={34} />
            <h2 className="mt-3 text-xl font-black text-pitch-950">PRONTO PARA SORTEAR</h2>
            <p className="mt-1 text-sm text-ink-500">
              As {config.teamCount} equipes serão sorteadas uma a uma, ao vivo, formando os jogos J1 a J5.
            </p>
            <Button size="lg" className="mt-5" onClick={startDraw}>
              <Shuffle size={18} className="mr-2 inline" /> INICIAR SORTEIO
            </Button>
          </Card>
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">{activeTeams.length} times aguardando sorteio</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
            {activeTeams.map((team) => (
              <div key={team.id} className="flex flex-col items-center gap-1.5 rounded-xl border border-ink-100 bg-white p-3 text-center">
                <TeamShield name={team.name} shieldUrl={team.shieldUrl} size="md" />
                <span className="line-clamp-2 text-[10px] font-bold text-ink-500">{team.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : phase === 'drawing' ? (
        <DrawingCeremony
          nextIndex={nextIndex}
          currentMatch={currentMatch}
          isSlotA={isSlotA}
          shuffling={shuffling}
          flashTeamId={flashTeamId}
          teamById={teamById}
          revealed={revealed}
          firstPhase={firstPhase}
          remainingTeams={remainingTeams}
          justPaired={justPaired}
          onDraw={drawNext}
          onContinue={continueAfterPair}
        />
      ) : (
        <div>
          <Card className="mb-5 flex flex-col items-center gap-2 p-6 text-center">
            <PartyPopper className="text-gold-500" size={30} />
            <h2 className="text-xl font-black text-pitch-950">SORTEIO CONCLUÍDO!</h2>
            <p className="text-sm text-ink-500">Confira os confrontos antes de confirmar oficialmente.</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={discardDraw}>
                <RotateCcw size={15} className="mr-1.5 inline" /> REFAZER
              </Button>
              <Button onClick={confirmDraw} loading={confirming}>
                <Trophy size={16} className="mr-1.5 inline" /> CONFIRMAR SORTEIO
              </Button>
            </div>
          </Card>
          <DrawSummaryGrid
            matches={firstPhase}
            teamById={teamById}
            override={(index) => ({ teamAId: revealed[index * 2], teamBId: revealed[index * 2 + 1] })}
          />
        </div>
      )}

      <ConfirmDialog
        open={redoConfirm}
        title="REFAZER SORTEIO"
        message="Isso apaga os confrontos atuais de J1 a J5, permitindo sortear novamente do zero."
        confirmLabel="REFAZER"
        danger
        requirePhrase="REFAZER SORTEIO"
        onConfirm={handleRedo}
        onCancel={() => setRedoConfirm(false)}
      />
    </div>
  )
}

function DrawSummaryGrid({
  matches,
  teamById,
  override,
  className = '',
}: {
  matches: Match[]
  teamById: Map<string, Team>
  override?: (index: number) => { teamAId: string | null; teamBId: string | null }
  className?: string
}) {
  const groups: Record<string, Match[]> = {}
  matches.forEach((m) => {
    const key = m.date ?? '—'
    groups[key] = groups[key] ?? []
    groups[key].push(m)
  })

  return (
    <div className={className}>
      {Object.entries(groups).map(([date, group]) => (
        <div key={date} className="mb-5">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-brand-700">{formatDate(date)}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.map((match) => {
              const idx = matches.indexOf(match)
              const ids = override ? override(idx) : { teamAId: match.teamAId, teamBId: match.teamBId }
              const teamA = ids.teamAId ? teamById.get(ids.teamAId) : null
              const teamB = ids.teamBId ? teamById.get(ids.teamBId) : null
              return (
                <Card key={match.id} className="p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-ink-400">
                    <span>{match.matchNumber}</span>
                    <span>{match.time}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <TeamMini team={teamA} />
                    <span className="text-xs font-black text-ink-300">×</span>
                    <TeamMini team={teamB} />
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TeamMini({ team }: { team: Team | null | undefined }) {
  if (!team) {
    return (
      <span className="flex flex-1 flex-col items-center gap-1 text-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-ink-200 text-ink-300">?</span>
        <span className="text-[10px] font-bold text-ink-300">A DEFINIR</span>
      </span>
    )
  }
  return (
    <span className="flex flex-1 flex-col items-center gap-1 text-center">
      <TeamShield name={team.name} shieldUrl={team.shieldUrl} size="md" />
      <span className="line-clamp-1 text-[10px] font-bold text-pitch-950">{team.name}</span>
    </span>
  )
}

function DrawingCeremony({
  nextIndex,
  currentMatch,
  isSlotA,
  shuffling,
  flashTeamId,
  teamById,
  revealed,
  firstPhase,
  remainingTeams,
  justPaired,
  onDraw,
  onContinue,
}: {
  nextIndex: number
  currentMatch: Match | null
  isSlotA: boolean
  shuffling: boolean
  flashTeamId: string | null
  teamById: Map<string, Team>
  revealed: (string | null)[]
  firstPhase: Match[]
  remainingTeams: Team[]
  justPaired: boolean
  onDraw: () => void
  onContinue: () => void
}) {
  const flashTeam = flashTeamId ? teamById.get(flashTeamId) : null
  const pairedMatch = justPaired ? firstPhase[Math.floor((nextIndex === -1 ? revealed.length - 1 : nextIndex - 1) / 2)] : null
  const pairedIndex = pairedMatch ? firstPhase.indexOf(pairedMatch) : -1
  const pairedTeamA = pairedIndex >= 0 ? teamById.get(revealed[pairedIndex * 2] ?? '') : null
  const pairedTeamB = pairedIndex >= 0 ? teamById.get(revealed[pairedIndex * 2 + 1] ?? '') : null

  const donePairs = firstPhase
    .map((match, i) => ({ match, teamA: teamById.get(revealed[i * 2] ?? ''), teamB: teamById.get(revealed[i * 2 + 1] ?? '') }))
    .filter((p) => p.teamA && p.teamB)

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(150deg,#020816,#062b68_65%,#020816)] p-6 text-white sm:p-10">
      <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />

      {justPaired && pairedMatch ? (
        <div className="relative flex flex-col items-center gap-6 py-6 text-center">
          <p className="text-xs font-black uppercase tracking-[.3em] text-gold-400">Confronto definido</p>
          <div className="flex items-center gap-6 sm:gap-10">
            <div className="flex flex-col items-center gap-2">
              <TeamShield name={pairedTeamA?.name ?? ''} shieldUrl={pairedTeamA?.shieldUrl} size="xl" className="animate-draw-reveal animate-draw-glow" />
              <span className="max-w-[8rem] text-sm font-black leading-tight">{pairedTeamA?.name}</span>
            </div>
            <span className="text-2xl font-black text-gold-400">×</span>
            <div className="flex flex-col items-center gap-2">
              <TeamShield name={pairedTeamB?.name ?? ''} shieldUrl={pairedTeamB?.shieldUrl} size="xl" className="animate-draw-reveal animate-draw-glow" />
              <span className="max-w-[8rem] text-sm font-black leading-tight">{pairedTeamB?.name}</span>
            </div>
          </div>
          <div className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold">
            {pairedMatch.matchNumber} • {formatDate(pairedMatch.date ?? '')} • {pairedMatch.time}
          </div>
          <Button size="lg" onClick={onContinue}>
            {revealed.every((v) => v !== null) ? 'VER RESUMO DO SORTEIO' : 'CONTINUAR SORTEIO'}
          </Button>
        </div>
      ) : (
        <div className="relative flex flex-col items-center gap-6 py-4 text-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.3em] text-gold-400">Posição {nextIndex + 1} de 10</p>
            <p className="mt-1 text-sm text-blue-100">
              {currentMatch?.matchNumber} • {isSlotA ? 'define o primeiro time' : 'sorteando o adversário'}
              {!isSlotA && currentMatch && ' — aguardando adversário'}
            </p>
          </div>

          <div className={`flex h-32 w-32 items-center justify-center rounded-full border-2 sm:h-40 sm:w-40 ${shuffling ? 'border-gold-400/60' : 'border-white/15'}`}>
            {flashTeam ? (
              <TeamShield
                name={flashTeam.name}
                shieldUrl={flashTeam.shieldUrl}
                size="xl"
                className={shuffling ? 'animate-draw-shuffle' : 'animate-draw-reveal'}
              />
            ) : (
              <span className="text-4xl font-black text-white/20">?</span>
            )}
          </div>
          {flashTeam && !shuffling && <p className="text-lg font-black">{flashTeam.name}</p>}

          <Button size="lg" onClick={onDraw} loading={shuffling} disabled={shuffling}>
            <Shuffle size={18} className="mr-2 inline" /> SORTEAR
          </Button>
        </div>
      )}

      <div className="relative mt-8 grid gap-6 border-t border-white/10 pt-6 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-blue-200">Confrontos definidos</p>
          {donePairs.length === 0 ? (
            <p className="text-xs text-blue-100/60">Nenhum ainda.</p>
          ) : (
            <div className="space-y-1.5">
              {donePairs.map((p) => (
                <div key={p.match.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold">
                  <span>{p.match.matchNumber}</span>
                  <span>{p.teamA?.name} × {p.teamB?.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-blue-200">{remainingTeams.length} times restantes</p>
          <div className="flex flex-wrap gap-2">
            {remainingTeams.map((team) => (
              <TeamShield key={team.id} name={team.name} shieldUrl={team.shieldUrl} size="sm" className="opacity-80" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
