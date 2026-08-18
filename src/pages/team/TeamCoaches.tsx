import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'
import { subscribeConfig, DEFAULT_CONFIG } from '../../data/config'
import { subscribeTeamCoaches, addCoach, updateCoach, removeCoach } from '../../data/coaches'
import { DuplicateDocumentError, LimitReachedError } from '../../data/players'
import { maskCPF } from '../../lib/format'
import type { ChampionshipConfig, Coach } from '../../types'

export default function TeamCoaches() {
  const { team } = useAuth()
  const toast = useToast()
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)

  const [fullName, setFullName] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editing, setEditing] = useState<Coach | null>(null)
  const [editName, setEditName] = useState('')
  const [removing, setRemoving] = useState<Coach | null>(null)

  useEffect(() => {
    if (!team) return
    const unsub = subscribeTeamCoaches(team.id, (list) => {
      setCoaches(list)
      setLoading(false)
    })
    return unsub
  }, [team])

  useEffect(() => subscribeConfig(setConfig), [])

  if (!team) return null

  const limit = config.coachLimit
  const atLimit = team.coachCount >= limit
  const locked = !config.registrationsOpen

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!team) return
    setSubmitting(true)
    try {
      await addCoach({ teamId: team.id, teamName: team.name, fullName, document: documentNumber, limit })
      toast.success('Técnico adicionado com sucesso.')
      setFullName('')
      setDocumentNumber('')
    } catch (err) {
      if (err instanceof DuplicateDocumentError) {
        toast.error('ATENÇÃO. ESTE DOCUMENTO JÁ ESTÁ CADASTRADO EM OUTRA EQUIPE. ENTRE EM CONTATO COM A ORGANIZAÇÃO.')
      } else if (err instanceof LimitReachedError) {
        toast.error(err.message)
      } else {
        toast.error('Não foi possível adicionar o técnico.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSave() {
    if (!editing) return
    try {
      await updateCoach({ coachId: editing.id, fullName: editName })
      toast.success('Técnico atualizado.')
      setEditing(null)
    } catch {
      toast.error('Não foi possível atualizar o técnico.')
    }
  }

  async function handleRemove() {
    if (!removing || !team) return
    try {
      await removeCoach({ coachId: removing.id, teamId: team.id, documentNormalized: removing.documentNormalized })
      toast.success('Técnico removido.')
      setRemoving(null)
    } catch {
      toast.error('Não foi possível remover o técnico.')
    }
  }

  return (
    <div>
      <PageHeader
        title="COMISSÃO TÉCNICA"
        subtitle={locked ? 'As inscrições estão encerradas — consulta apenas.' : 'Gerencie os técnicos do seu time.'}
      />

      {!locked && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Input label="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={atLimit} />
            <Input
              label="Documento"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(maskCPF(e.target.value))}
              required
              disabled={atLimit}
            />
            <Button type="submit" loading={submitting} disabled={atLimit} className="h-fit">
              ADICIONAR TÉCNICO
            </Button>
          </form>
          {atLimit && <p className="mt-3 text-sm font-semibold text-amber-600">LIMITE DE {limit} TÉCNICOS ATINGIDO.</p>}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <p className="text-sm font-bold text-ink-700">
            COMISSÃO TÉCNICA: {team.coachCount} / {limit}
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <TableSkeleton rows={2} />
            </div>
          ) : coaches.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-400">Nenhum técnico cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Nome completo</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3 font-semibold text-ink-900">{c.fullName}</td>
                    <td className="px-5 py-3 text-ink-500">{c.document}</td>
                    <td className="px-5 py-3 text-right">
                      {!locked && (
                        <div className="inline-flex gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditing(c)
                              setEditName(c.fullName)
                            }}
                          >
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setRemoving(c)}>
                            Excluir
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="EDITAR TÉCNICO"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              CANCELAR
            </Button>
            <Button onClick={handleEditSave}>SALVAR</Button>
          </>
        }
      >
        <Input label="Nome completo" value={editName} onChange={(e) => setEditName(e.target.value)} />
      </Modal>

      <ConfirmDialog
        open={!!removing}
        title="EXCLUIR TÉCNICO"
        message={`Tem certeza que deseja excluir ${removing?.fullName}?`}
        confirmLabel="EXCLUIR"
        danger
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
