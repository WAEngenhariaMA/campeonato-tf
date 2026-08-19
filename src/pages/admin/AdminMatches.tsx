import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Select, Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { subscribeTeams } from '../../data/teams'
import { createOfficialSchedule, subscribeMatches, updateMatch } from '../../data/matches'
import type { Match, Team } from '../../types'

const PHASE_LABEL: Record<string, string> = { PRIMEIRA_FASE: '1ª FASE', PLAYOFF: 'PLAYOFF', SEMIFINAL: 'SEMIFINAL', TERCEIRO_LUGAR: '3º LUGAR', FINAL: 'FINAL' }

function MatchEditor({ match, teams }: { match: Match; teams: Team[] }) {
  const toast = useToast()
  const [form, setForm] = useState({ teamAId: match.teamAId ?? '', teamBId: match.teamBId ?? '', date: match.date ?? '', time: match.time ?? '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => setForm({ teamAId: match.teamAId ?? '', teamBId: match.teamBId ?? '', date: match.date ?? '', time: match.time ?? '' }), [match])
  async function save() {
    if (form.teamAId && form.teamAId === form.teamBId) { toast.error('Uma partida precisa de dois times diferentes.'); return }
    setSaving(true)
    try { await updateMatch(match.id, { teamAId: form.teamAId || null, teamBId: form.teamBId || null, date: form.date || null, time: form.time || null }); toast.success(`${match.matchNumber} atualizado.`) }
    catch { toast.error(`Não foi possível atualizar ${match.matchNumber}.`) } finally { setSaving(false) }
  }
  return <tr className="border-b border-ink-100 last:border-0">
    <td className="px-4 py-3"><p className="font-bold text-pitch-950">{match.matchNumber}</p><Badge tone="neutral">{PHASE_LABEL[match.phase]}</Badge></td>
    <td className="px-2 py-3"><Select value={form.teamAId} onChange={(e) => setForm({ ...form, teamAId: e.target.value })}><option value="">Definir time A</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</Select></td>
    <td className="px-2 py-3 text-center font-bold text-ink-400">×</td>
    <td className="px-2 py-3"><Select value={form.teamBId} onChange={(e) => setForm({ ...form, teamBId: e.target.value })}><option value="">Definir time B</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</Select></td>
    <td className="px-2 py-3"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></td>
    <td className="px-2 py-3"><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></td>
    <td className="px-4 py-3"><Button size="sm" onClick={save} loading={saving}>SALVAR</Button></td>
  </tr>
}

export default function AdminMatches() {
  const toast = useToast(); const [teams, setTeams] = useState<Team[]>([]); const [matches, setMatches] = useState<Match[]>([]); const [creating, setCreating] = useState(false)
  useEffect(() => subscribeTeams(setTeams), []); useEffect(() => subscribeMatches(setMatches), [])
  const firstPhaseReady = useMemo(() => matches.some((match) => match.matchNumber === 'J1'), [matches])
  async function createSchedule() { setCreating(true); try { await createOfficialSchedule(); toast.success('Calendário oficial criado. Defina os confrontos da primeira fase.'); } catch { toast.error('Não foi possível criar o calendário.') } finally { setCreating(false) } }
  return <div><PageHeader title="CONFRONTOS" subtitle="Calendário oficial e definição manual dos jogos." action={!firstPhaseReady ? <Button onClick={createSchedule} loading={creating}>GERAR CALENDÁRIO OFICIAL</Button> : undefined} />
    {!firstPhaseReady ? <Card className="p-8 text-center"><p className="font-semibold text-pitch-950">O calendário ainda não foi criado.</p><p className="mt-2 text-sm text-ink-500">A ação cria J1 a J11 com as datas e horários oficiais. Os times permanecem sob controle da organização.</p></Card> :
      <Card><div className="overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead><tr className="border-b border-ink-100 text-xs font-bold uppercase tracking-wide text-ink-400"><th className="px-4 py-3">Jogo</th><th className="px-2 py-3">Time A</th><th /><th className="px-2 py-3">Time B</th><th className="px-2 py-3">Data</th><th className="px-2 py-3">Horário</th><th className="px-4 py-3">Ação</th></tr></thead><tbody>{matches.map((match) => <MatchEditor key={match.id} match={match} teams={teams} />)}</tbody></table></div></Card>}
  </div>
}
