import { useEffect, useMemo, useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { FileText, Download, ShieldAlert } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { TeamBadge } from '../../components/public/TeamBadge'
import { subscribeTeams } from '../../data/teams'
import { subscribeMatches, getTournament, type DisciplinaryPlayer } from '../../data/matches'
import { listAllPlayers } from '../../data/players'
import { listAllCoaches } from '../../data/coaches'
import { getRegistration } from '../../data/representatives'
import { subscribeConfig, DEFAULT_CONFIG } from '../../data/config'
import { MatchReportDocument } from '../../pdf/MatchReportDocument'
import type { ChampionshipConfig, Coach, Match, Player, RepresentativeRegistration, Team } from '../../types'

const PHASE_LABEL: Record<string, string> = {
  PRIMEIRA_FASE: '1ª FASE',
  PLAYOFF: 'PLAYOFF',
  SEMIFINAL: 'SEMIFINAL',
  TERCEIRO_LUGAR: '3º LUGAR',
  FINAL: 'FINAL',
}

function RosterCheckList({
  title,
  players,
  suspendedIds,
  onToggle,
}: {
  title: string
  players: Player[]
  suspendedIds: Set<string>
  onToggle: (playerId: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-400">{title}</p>
      <div className="max-h-64 overflow-y-auto rounded-xl border border-ink-100">
        {players.length === 0 ? (
          <p className="p-4 text-sm text-ink-400">Nenhum jogador cadastrado.</p>
        ) : (
          players.map((player, i) => (
            <label
              key={player.id}
              className="flex cursor-pointer items-center justify-between gap-3 border-b border-ink-50 px-3 py-2 text-sm last:border-0 hover:bg-ink-50/60"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="w-5 shrink-0 text-xs text-ink-400">{i + 1}</span>
                <span className="truncate">{player.fullName}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-red-600">
                {suspendedIds.has(player.id) && <ShieldAlert size={13} />}
                SUSPENSO
                <input type="checkbox" checked={suspendedIds.has(player.id)} onChange={() => onToggle(player.id)} />
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  )
}

export default function AdminMatchReports() {
  const toast = useToast()
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [disciplinary, setDisciplinary] = useState<DisciplinaryPlayer[]>([])
  const [loading, setLoading] = useState(true)

  const [matchId, setMatchId] = useState('')
  const [suspendedIds, setSuspendedIds] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)

  useEffect(() => subscribeConfig(setConfig), [])
  useEffect(() => subscribeTeams(setTeams), [])
  useEffect(() => subscribeMatches(setMatches), [])
  useEffect(() => {
    Promise.all([listAllPlayers(), listAllCoaches(), getTournament()])
      .then(([playerList, coachList, tournament]) => {
        setPlayers(playerList)
        setCoaches(coachList)
        setDisciplinary(tournament.disciplinary)
      })
      .finally(() => setLoading(false))
  }, [])

  const teamsById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])
  const playableMatches = useMemo(() => matches.filter((m) => m.teamAId && m.teamBId), [matches])
  const match = playableMatches.find((m) => m.id === matchId) ?? null

  const rosterA = useMemo(
    () => (match?.teamAId ? players.filter((p) => p.teamId === match.teamAId).sort((a, b) => a.fullName.localeCompare(b.fullName)) : []),
    [players, match],
  )
  const rosterB = useMemo(
    () => (match?.teamBId ? players.filter((p) => p.teamId === match.teamBId).sort((a, b) => a.fullName.localeCompare(b.fullName)) : []),
    [players, match],
  )
  const coachesA = useMemo(() => (match?.teamAId ? coaches.filter((c) => c.teamId === match.teamAId) : []), [coaches, match])
  const coachesB = useMemo(() => (match?.teamBId ? coaches.filter((c) => c.teamId === match.teamBId) : []), [coaches, match])

  // Ao trocar de confronto, pré-marca quem já está suspenso de verdade (cartão vermelho/acúmulo
  // de amarelos), mas o admin pode ajustar antes de gerar — não é salvo, só reflete no PDF.
  useEffect(() => {
    if (!match) {
      setSuspendedIds(new Set())
      return
    }
    const relevant = disciplinary.filter((p) => (p.teamId === match.teamAId || p.teamId === match.teamBId) && p.suspensionMatches > 0)
    setSuspendedIds(new Set(relevant.map((p) => p.playerId)))
  }, [match, disciplinary])

  function toggleSuspended(playerId: string) {
    setSuspendedIds((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  async function generate() {
    if (!match) return
    setGenerating(true)
    try {
      const teamA = match.teamAId ? (teamsById.get(match.teamAId) ?? null) : null
      const teamB = match.teamBId ? (teamsById.get(match.teamBId) ?? null) : null
      const [registrationA, registrationB] = await Promise.all([
        match.teamAId ? getRegistration(match.teamAId) : Promise.resolve(null as RepresentativeRegistration | null),
        match.teamBId ? getRegistration(match.teamBId) : Promise.resolve(null as RepresentativeRegistration | null),
      ])

      const blob = await pdf(
        <MatchReportDocument
          config={config}
          match={match}
          teamA={teamA}
          teamB={teamB}
          playersA={rosterA}
          playersB={rosterB}
          coachesA={coachesA}
          coachesB={coachesB}
          registrationA={registrationA}
          registrationB={registrationB}
          suspendedIds={suspendedIds}
        />,
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `sumula-${match.matchNumber}-${(teamA?.shortName ?? 'timeA').toLowerCase()}-x-${(teamB?.shortName ?? 'timeB').toLowerCase()}.pdf`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success('Súmula gerada. O download deve começar automaticamente.')
    } catch {
      toast.error('Não foi possível gerar o PDF da súmula.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="SÚMULAS"
        subtitle="Gere a súmula oficial em PDF, pronta para imprimir e preencher em campo."
      />

      <Card className="p-5">
        <Select label="Confronto" value={matchId} onChange={(e) => setMatchId(e.target.value)} disabled={loading}>
          <option value="">Selecione o jogo...</option>
          {playableMatches.map((m) => (
            <option key={m.id} value={m.id}>
              {m.matchNumber} · {PHASE_LABEL[m.phase] ?? m.phase} · {teamsById.get(m.teamAId!)?.name ?? '—'} × {teamsById.get(m.teamBId!)?.name ?? '—'}
            </option>
          ))}
        </Select>
        {!loading && playableMatches.length === 0 && (
          <p className="mt-3 text-sm text-ink-400">Nenhum confronto com os dois times definidos ainda.</p>
        )}
      </Card>

      {match && (
        <div className="mt-5 space-y-5">
          <Card className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <TeamBadge name={teamsById.get(match.teamAId!)?.name ?? 'A DEFINIR'} shieldUrl={teamsById.get(match.teamAId!)?.shieldUrl} size="lg" />
                <span className="text-lg font-black text-ink-300">×</span>
                <TeamBadge name={teamsById.get(match.teamBId!)?.name ?? 'A DEFINIR'} shieldUrl={teamsById.get(match.teamBId!)?.shieldUrl} size="lg" />
              </div>
              <p className="text-xs text-ink-500">{match.date ?? 'Data a definir'} • {match.time ?? 'Horário a definir'}</p>
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-700">
              <ShieldAlert size={16} className="text-red-600" /> Marque quem está suspenso para este jogo
            </p>
            <p className="mb-4 text-xs text-ink-500">
              Jogadores com suspensão pendente (cartão vermelho ou acúmulo de amarelos) já vêm marcados — confira e ajuste se precisar antes de gerar.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              <RosterCheckList title={teamsById.get(match.teamAId!)?.name ?? 'TIME A'} players={rosterA} suspendedIds={suspendedIds} onToggle={toggleSuspended} />
              <RosterCheckList title={teamsById.get(match.teamBId!)?.name ?? 'TIME B'} players={rosterB} suspendedIds={suspendedIds} onToggle={toggleSuspended} />
            </div>
          </Card>

          <Button size="lg" onClick={generate} loading={generating}>
            <FileText size={18} className="mr-2 inline" /> GERAR PDF DA SÚMULA
            <Download size={16} className="ml-2 inline" />
          </Button>
        </div>
      )}
    </div>
  )
}
