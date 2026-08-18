import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { subscribeConfig, updateConfig, DEFAULT_CONFIG } from '../../data/config'
import type { ChampionshipConfig } from '../../types'

export default function AdminConfig() {
  const toast = useToast()
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [form, setForm] = useState<ChampionshipConfig>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [toggleConfirm, setToggleConfirm] = useState(false)

  useEffect(
    () =>
      subscribeConfig((c) => {
        setConfig(c)
        setForm(c)
      }),
    [],
  )

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
