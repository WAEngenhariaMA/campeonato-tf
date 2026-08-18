import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { subscribeTeams, createTeam, removeTeam, resetTeamPassword, updateTeam } from '../../data/teams'
import { subscribeRegistrations, deleteRegistration } from '../../data/representatives'
import { subscribeConfig, DEFAULT_CONFIG } from '../../data/config'
import type { ChampionshipConfig, RepresentativeRegistration, Team } from '../../types'

type ComputedStatus = 'NAO_INICIADO' | 'CADASTRO_INCOMPLETO' | 'COMPLETO' | 'BLOQUEADO'

const STATUS_TONE: Record<ComputedStatus, 'neutral' | 'warning' | 'success' | 'danger'> = {
  NAO_INICIADO: 'neutral',
  CADASTRO_INCOMPLETO: 'warning',
  COMPLETO: 'success',
  BLOQUEADO: 'danger',
}

function computeStatus(team: Team, config: ChampionshipConfig, hasRegistration: boolean): ComputedStatus {
  if (!team.active) return 'BLOQUEADO'
  const complete = hasRegistration && team.playerCount >= config.playerLimit && team.coachCount >= config.coachLimit
  if (complete) return 'COMPLETO'
  const started = hasRegistration || team.playerCount > 0 || team.coachCount > 0
  return started ? 'CADASTRO_INCOMPLETO' : 'NAO_INICIADO'
}

export default function AdminTeams() {
  const toast = useToast()
  const [teams, setTeams] = useState<Team[]>([])
  const [registrations, setRegistrations] = useState<RepresentativeRegistration[]>([])
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', shortName: '', login: '', password: '' })

  const [detail, setDetail] = useState<Team | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [editForm, setEditForm] = useState({ name: '', shortName: '', login: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<Team | null>(null)
  const [resetConfirm, setResetConfirm] = useState<Team | null>(null)
  const [toggleConfirm, setToggleConfirm] = useState<Team | null>(null)

  useEffect(() => {
    const unsub = subscribeTeams((list) => {
      setTeams(list)
      setLoading(false)
    })
    return unsub
  }, [])
  useEffect(() => subscribeRegistrations(setRegistrations), [])
  useEffect(() => subscribeConfig(setConfig), [])

  const regByTeam = useMemo(() => new Map(registrations.map((r) => [r.teamId, r])), [registrations])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      await createTeam(form)
      toast.success('Time criado com sucesso.')
      setCreateOpen(false)
      setForm({ name: '', shortName: '', login: '', password: '' })
    } catch {
      toast.error('Não foi possível criar o time. Verifique se o login já está em uso.')
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive() {
    if (!toggleConfirm) return
    await updateTeam(toggleConfirm.id, { active: !toggleConfirm.active })
    toast.success(toggleConfirm.active ? 'Acesso do time bloqueado.' : 'Acesso do time liberado.')
    setToggleConfirm(null)
    setDetail(null)
  }

  async function handleResetRegistration() {
    if (!resetConfirm) return
    await deleteRegistration(resetConfirm.id)
    toast.success('Cadastro de representantes reiniciado. O time pode enviar novamente.')
    setResetConfirm(null)
  }

  function openEdit(team: Team) {
    setEditing(team)
    setEditForm({ name: team.name, shortName: team.shortName, login: team.login })
    setEditOpen(true)
  }

  async function handleEdit(e: FormEvent) {
    e.preventDefault()
    if (!editing) return
    setSavingEdit(true)
    try {
      await updateTeam(editing.id, editForm)
      toast.success('Dados do time atualizados.')
      setEditOpen(false)
      setDetail(null)
    } catch {
      toast.error('Não foi possível salvar. Verifique se o login já está em uso.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault()
    if (!detail) return
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    setSavingPassword(true)
    try {
      await resetTeamPassword(detail.id, newPassword)
      toast.success(`Senha de ${detail.name} redefinida.`)
      setNewPassword('')
      setPasswordOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.')
    } finally {
      setSavingPassword(false)
    }
  }

  async function handleRemoveTeam() {
    if (!removeConfirm) return
    try {
      await removeTeam(removeConfirm.id)
      toast.success(`${removeConfirm.name} foi removido.`)
      setDetail(null)
      setRemoveConfirm(null)
    } catch {
      toast.error('Não foi possível remover o time.')
    }
  }

  return (
    <div>
      <PageHeader
        title="TIMES"
        subtitle={`${teams.length} / ${config.teamCount} equipes cadastradas`}
        action={
          teams.length < config.teamCount && (
            <Button onClick={() => setCreateOpen(true)}>+ NOVO TIME</Button>
          )
        }
      />

      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Representantes</th>
                  <th className="px-5 py-3">Jogadores</th>
                  <th className="px-5 py-3">Técnicos</th>
                  <th className="px-5 py-3">Situação</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => {
                  const reg = regByTeam.get(t.id)
                  const status = computeStatus(t, config, !!reg)
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setDetail(t)}
                      className="cursor-pointer border-b border-ink-50 last:border-0 hover:bg-ink-50/60"
                    >
                      <td className="px-5 py-3 font-semibold text-ink-900">{t.name}</td>
                      <td className="px-5 py-3 tabular-nums text-ink-500">{reg ? '2/2' : '0/2'}</td>
                      <td className="px-5 py-3 tabular-nums text-ink-500">
                        {t.playerCount}/{config.playerLimit}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-ink-500">
                        {t.coachCount}/{config.coachLimit}
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={STATUS_TONE[status]}>{status.replace(/_/g, ' ')}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="NOVO TIME"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              CANCELAR
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              CRIAR TIME
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label="Nome oficial" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input
            label="Nome curto"
            value={form.shortName}
            onChange={(e) => setForm({ ...form, shortName: e.target.value })}
            required
          />
          <Input label="Login" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} required />
          <Input
            label="Senha inicial"
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="Mínimo 6 caracteres. Compartilhe com os representantes do time."
            required
            minLength={6}
          />
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ''}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Login</p>
                <p className="font-semibold text-ink-900">{detail.login}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Situação</p>
                <Badge tone={detail.active ? 'success' : 'danger'}>{detail.active ? 'ATIVO' : 'BLOQUEADO'}</Badge>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Jogadores</p>
                <p className="font-semibold text-ink-900">
                  {detail.playerCount} / {config.playerLimit}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-ink-400">Técnicos</p>
                <p className="font-semibold text-ink-900">
                  {detail.coachCount} / {config.coachLimit}
                </p>
              </div>
            </div>
            {regByTeam.get(detail.id) && (
              <div className="rounded-xl bg-ink-50 p-3">
                <p className="text-xs font-semibold uppercase text-ink-400">Representantes</p>
                <p className="mt-1 font-semibold text-ink-900">
                  {regByTeam.get(detail.id)!.rep1Name} — {regByTeam.get(detail.id)!.rep1Phone}
                </p>
                <p className="font-semibold text-ink-900">
                  {regByTeam.get(detail.id)!.rep2Name} — {regByTeam.get(detail.id)!.rep2Phone}
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              <Button size="sm" variant="secondary" onClick={() => openEdit(detail)}>
                EDITAR TIME
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setPasswordOpen(true)}>
                REDEFINIR SENHA
              </Button>
              <Button size="sm" variant={detail.active ? 'danger' : 'primary'} onClick={() => setToggleConfirm(detail)}>
                {detail.active ? 'BLOQUEAR ACESSO' : 'DESBLOQUEAR ACESSO'}
              </Button>
              {regByTeam.get(detail.id) && (
                <Button size="sm" variant="secondary" onClick={() => setResetConfirm(detail)}>
                  REDEFINIR CADASTRO DE REPRESENTANTES
                </Button>
              )}
              <Button size="sm" variant="danger" onClick={() => setRemoveConfirm(detail)}>
                REMOVER TIME
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`EDITAR ${editing?.name ?? 'TIME'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>CANCELAR</Button>
            <Button onClick={() => (document.getElementById('edit-team-form') as HTMLFormElement | null)?.requestSubmit()} loading={savingEdit}>SALVAR</Button>
          </>
        }
      >
        <form id="edit-team-form" onSubmit={handleEdit} className="space-y-3">
          <Input label="Nome oficial" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
          <Input label="Nome curto" value={editForm.shortName} onChange={(e) => setEditForm({ ...editForm, shortName: e.target.value })} required />
          <Input label="Login" value={editForm.login} onChange={(e) => setEditForm({ ...editForm, login: e.target.value })} required />
        </form>
      </Modal>

      <Modal
        open={passwordOpen}
        onClose={() => { setPasswordOpen(false); setNewPassword('') }}
        title={`NOVA SENHA — ${detail?.name ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setPasswordOpen(false); setNewPassword('') }}>CANCELAR</Button>
            <Button onClick={() => (document.getElementById('reset-password-form') as HTMLFormElement | null)?.requestSubmit()} loading={savingPassword}>DEFINIR SENHA</Button>
          </>
        }
      >
        <form id="reset-password-form" onSubmit={handlePassword} className="space-y-3">
          <Input label="Nova senha" type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="Mínimo 6 caracteres. A senha anterior não pode ser visualizada." required minLength={6} />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toggleConfirm}
        title={toggleConfirm?.active ? 'BLOQUEAR ACESSO' : 'DESBLOQUEAR ACESSO'}
        message={`Confirma ${toggleConfirm?.active ? 'bloquear' : 'desbloquear'} o acesso do time ${toggleConfirm?.name}?`}
        danger={toggleConfirm?.active}
        onConfirm={handleToggleActive}
        onCancel={() => setToggleConfirm(null)}
      />

      <ConfirmDialog
        open={!!removeConfirm}
        title="REMOVER TIME"
        message={`Isso remove ${removeConfirm?.name}, a conta de acesso, jogadores, técnicos e representantes vinculados. Digite REMOVER para confirmar.`}
        confirmLabel="REMOVER DEFINITIVAMENTE"
        danger
        requirePhrase="REMOVER"
        onConfirm={handleRemoveTeam}
        onCancel={() => setRemoveConfirm(null)}
      />

      <ConfirmDialog
        open={!!resetConfirm}
        title="REDEFINIR CADASTRO"
        message={`Isso apaga o cadastro de representantes de ${resetConfirm?.name}, permitindo um novo envio. Continuar?`}
        confirmLabel="REDEFINIR"
        danger
        onConfirm={handleResetRegistration}
        onCancel={() => setResetConfirm(null)}
      />
    </div>
  )
}
