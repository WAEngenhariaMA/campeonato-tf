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
import {
  subscribeTeamPlayers,
  addPlayer,
  updatePlayer,
  removePlayer,
  DuplicateDocumentError,
  LimitReachedError,
} from '../../data/players'
import { maskCPF } from '../../lib/format'
import type { ChampionshipConfig, Player } from '../../types'

export default function TeamPlayers() {
  const { team } = useAuth()
  const toast = useToast()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<ChampionshipConfig>(DEFAULT_CONFIG)

  const [fullName, setFullName] = useState('')
  const [documentNumber, setDocumentNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editing, setEditing] = useState<Player | null>(null)
  const [editName, setEditName] = useState('')
  const [removing, setRemoving] = useState<Player | null>(null)

  useEffect(() => {
    if (!team) return
    const unsub = subscribeTeamPlayers(team.id, (list) => {
      setPlayers(list)
      setLoading(false)
    })
    return unsub
  }, [team])

  useEffect(() => subscribeConfig(setConfig), [])

  if (!team) return null

  const limit = config.playerLimit
  const atLimit = team.playerCount >= limit
  const locked = !config.registrationsOpen

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    if (!team) return
    setSubmitting(true)
    try {
      await addPlayer({ teamId: team.id, teamName: team.name, fullName, document: documentNumber, limit })
      toast.success('Jogador adicionado com sucesso.')
      setFullName('')
      setDocumentNumber('')
    } catch (err) {
      if (err instanceof DuplicateDocumentError) {
        toast.error('ATENÇÃO. ESTE DOCUMENTO JÁ ESTÁ CADASTRADO EM OUTRA EQUIPE. ENTRE EM CONTATO COM A ORGANIZAÇÃO.')
      } else if (err instanceof LimitReachedError) {
        toast.error(err.message)
      } else {
        toast.error('Não foi possível adicionar o jogador.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEditSave() {
    if (!editing) return
    try {
      await updatePlayer({ playerId: editing.id, teamId: editing.teamId, fullName: editName })
      toast.success('Jogador atualizado.')
      setEditing(null)
    } catch {
      toast.error('Não foi possível atualizar o jogador.')
    }
  }

  async function handleRemove() {
    if (!removing) return
    try {
      await removePlayer({ playerId: removing.id, teamId: removing.teamId, documentNormalized: removing.documentNormalized })
      toast.success('Jogador removido.')
      setRemoving(null)
    } catch {
      toast.error('Não foi possível remover o jogador.')
    }
  }

  return (
    <div>
      <PageHeader
        title="JOGADORES"
        subtitle={locked ? 'As inscrições estão encerradas — consulta apenas.' : 'Gerencie o elenco do seu time.'}
      />

      {!locked && (
        <Card className="mb-6 p-5">
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Input
              label="Nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              disabled={atLimit}
            />
            <Input
              label="Documento"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(maskCPF(e.target.value))}
              required
              disabled={atLimit}
            />
            <Button type="submit" loading={submitting} disabled={atLimit} className="h-fit">
              ADICIONAR JOGADOR
            </Button>
          </form>
          {atLimit && (
            <p className="mt-3 text-sm font-semibold text-amber-600">LIMITE DE {limit} JOGADORES ATINGIDO.</p>
          )}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3">
          <p className="text-sm font-bold text-ink-700">
            JOGADORES CADASTRADOS: {team.playerCount} / {limit}
          </p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-5">
              <TableSkeleton />
            </div>
          ) : players.length === 0 ? (
            <p className="p-8 text-center text-sm text-ink-400">Nenhum jogador cadastrado ainda.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Nº</th>
                  <th className="px-5 py-3">Nome completo</th>
                  <th className="px-5 py-3">Documento</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => (
                  <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                    <td className="px-5 py-3 text-ink-400">{i + 1}</td>
                    <td className="px-5 py-3 font-semibold text-ink-900">{p.fullName}</td>
                    <td className="px-5 py-3 text-ink-500">{p.document}</td>
                    <td className="px-5 py-3 text-right">
                      {!locked && (
                        <div className="inline-flex gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditing(p)
                              setEditName(p.fullName)
                            }}
                          >
                            Editar
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => setRemoving(p)}>
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
        title="EDITAR JOGADOR"
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
        title="EXCLUIR JOGADOR"
        message={`Tem certeza que deseja excluir ${removing?.fullName}? Esta ação libera uma vaga no elenco.`}
        confirmLabel="EXCLUIR"
        danger
        onConfirm={handleRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
