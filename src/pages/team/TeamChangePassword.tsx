import { useState, type FormEvent } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'

export default function TeamChangePassword() {
  const { changePassword } = useAuth()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (next.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (next !== confirm) {
      setError('A confirmação não coincide com a nova senha.')
      return
    }
    setBusy(true)
    try {
      await changePassword(current, next)
      toast.success('Senha alterada com sucesso.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch {
      setError('Não foi possível alterar a senha. Verifique a senha atual.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="ALTERAR SENHA" subtitle="Atualize a senha de acesso do seu time." />
      <Card className="max-w-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Senha atual" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          <Input label="Nova senha" type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
          <Input label="Confirmar nova senha" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" loading={busy}>
            SALVAR NOVA SENHA
          </Button>
        </form>
      </Card>
    </div>
  )
}
