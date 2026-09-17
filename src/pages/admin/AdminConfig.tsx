import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { subscribeConfig, updateConfig, DEFAULT_CONFIG } from '../../data/config'
import { subscribeTeams, updateTeam } from '../../data/teams'
import type { ChampionshipConfig, Team } from '../../types'

export default function AdminConfig() {
  const toast = useToast()
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [form, setForm] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [toggleConfirm, setToggleConfirm] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])
  const [togglingTeamId, setTogglingTeamId] = useState<string | null>(null)

  useEffect(
    () =>
      subscribeConfig((c) => {
        setConfig(c)
        setForm(c)
      }),
    [],
  )
  useEffect(() => subscribeTeams(setTeams), [])

  async function handleTogglePlayersLocked(team: Team) {
    setTogglingTeamId(team.id)
    try {
      await updateTeam(team.id, { playersLocked: !team.playersLocked })
      toast.success(team.playersLocked ? `Cadastro de jogadores liberado para ${team.name}.` : `Cadastro de jogadores bloqueado para ${team.name}.`)
    } catch {
      toast.error('Não foi possível atualizar o bloqueio deste time.')
    } finally {
      setTogglingTeamId(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateConfig({
        name: form.name,
        season: form.season,
        playerLimit: form.playerLimit,
        coachLimit: form.coachLimit,
        representativeLimit: form.representativeLimit,
      })
      toast.success('Configurações salvas.')
    } catch {
      toast.error('Não foi possível salvar as configurações.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleRegistrations() {
    await updateConfig({ registrationsOpen: !config.registrationsOpen })
    toast.success(config.registrationsOpen ? 'Inscrições encerradas.' : 'Inscrições reabertas.')
    setToggleConfirm(false)
  }

  return (
    <div>
      <PageHeader title="CONFIGURAÇÕES" subtitle="Dados gerais do campeonato e regras de inscrição." />

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">Inscrições</h2>
            <p className="mt-1 text-sm text-ink-500">
              Quando encerradas, os times só podem consultar jogadores e técnicos — sem incluir, alterar ou excluir.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone={config.registrationsOpen ? 'success' : 'danger'}>
              {config.registrationsOpen ? 'ABERTAS' : 'ENCERRADAS'}
            </Badge>
            <Button variant={config.registrationsOpen ? 'danger' : 'primary'} onClick={() => setToggleConfirm(true)}>
              {config.registrationsOpen ? 'ENCERRAR INSCRIÇÕES' : 'REABRIR INSCRIÇÕES'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-ink-400">Bloqueio individual de cadastro de jogadores</h2>
        <p className="mt-1 text-sm text-ink-500">
          Bloqueia só o time escolhido, sem afetar os demais — diferente de "Encerrar inscrições", que vale pra todos de uma vez.
        </p>
        <div className="mt-4 divide-y divide-ink-100">
          {teams.map((team) => (
            <div key={team.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-bold text-ink-900">{team.name}</p>
                <p className="text-xs text-ink-400">{team.playerCount} jogador(es) cadastrado(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={team.playersLocked ? 'danger' : 'success'}>
                  {team.playersLocked ? 'BLOQUEADO' : 'LIBERADO'}
                </Badge>
                <Button
                  size="sm"
                  variant={team.playersLocked ? 'primary' : 'danger'}
                  loading={togglingTeamId === team.id}
                  onClick={() => handleTogglePlayersLocked(team)}
                >
                  {team.playersLocked ? 'LIBERAR' : 'BLOQUEAR'}
                </Button>
              </div>
            </div>
          ))}
          {teams.length === 0 && <p className="py-4 text-sm text-ink-400">Nenhum time cadastrado ainda.</p>}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-400">Dados do campeonato</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nome oficial" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Temporada" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
          <Input
            label="Limite de jogadores por time"
            type="number"
            value={form.playerLimit}
            onChange={(e) => setForm({ ...form, playerLimit: Number(e.target.value) })}
          />
          <Input
            label="Limite de técnicos por time"
            type="number"
            value={form.coachLimit}
            onChange={(e) => setForm({ ...form, coachLimit: Number(e.target.value) })}
          />
        </div>
        <Button className="mt-5" onClick={handleSave} loading={saving}>
          SALVAR ALTERAÇÕES
        </Button>
      </Card>

      <ConfirmDialog
        open={toggleConfirm}
        title={config.registrationsOpen ? 'ENCERRAR INSCRIÇÕES' : 'REABRIR INSCRIÇÕES'}
        message={
          config.registrationsOpen
            ? 'Os times deixarão de conseguir incluir, alterar ou excluir jogadores e técnicos. Continuar?'
            : 'Os times voltarão a conseguir incluir, alterar e excluir jogadores e técnicos. Continuar?'
        }
        danger={config.registrationsOpen}
        onConfirm={handleToggleRegistrations}
        onCancel={() => setToggleConfirm(false)}
      />
    </div>
  )
}
