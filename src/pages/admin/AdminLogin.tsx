import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { CHAMPIONSHIP_LOGO } from '../../lib/branding'

export default function AdminLogin() {
  const { role, signInAdmin } = useAuth()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (role === 'admin') return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInAdmin(login, password)
      navigate('/admin')
    } catch {
      setError('Login ou senha inválidos.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src={CHAMPIONSHIP_LOGO} alt="Copa Cohatrac TF" className="mx-auto h-20 w-20 rounded-2xl border border-gold-400/70 object-cover shadow-xl" />
          <h1 className="championship-wordmark mt-3 text-xl font-extrabold text-white">ORGANIZAÇÃO</h1>
          <p className="mt-1 text-xs font-bold tracking-wide text-gold-400">COPA COHATRAC TF 2026</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <Input label="Login" value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" required />
          <Input
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={busy}>
            ENTRAR
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-ink-400">
          <Link to="/" className="hover:underline">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  )
}
