import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Input } from './Input'

interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  /** When set, the user must type this exact phrase before confirming — for destructive, hard-to-undo actions. */
  requirePhrase?: string
  onConfirm: () => Promise<void> | void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'CONFIRMAR', danger, requirePhrase, onConfirm, onCancel }: Props) {
  const [busy, setBusy] = useState(false)
  const [typed, setTyped] = useState('')

  const canConfirm = !requirePhrase || typed.trim() === requirePhrase

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
      setTyped('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            VOLTAR
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={handleConfirm} loading={busy} disabled={!canConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{message}</p>
      {requirePhrase && (
        <div className="mt-4">
          <Input
            label={`DIGITE "${requirePhrase}" PARA CONFIRMAR`}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={requirePhrase}
          />
        </div>
      )}
    </Modal>
  )
}
