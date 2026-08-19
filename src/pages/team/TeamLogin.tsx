import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { CHAMPIONSHIP_LOGO } from '../../lib/branding'

export default function TeamLogin() {
  const { role, signInTeam } = useAuth()
  const navigate = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (role === 'team') return <Navigate to="/equipes" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInTeam(login, password)
      navigate('/equipes')
    } catch {
      setError('Login ou senha inválidos.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-pitch-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(13,101,218,.42),transparent_38%),linear-gradient(135deg,#020817_20%,#061c48_55%,#020817)]" />
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src={CHAMPIONSHIP_LOGO} alt="Copa Cohatrac TF" className="championship-glow mx-auto h-20 w-20 rounded-2xl object-cover" />
          <h1 className="championship-wordmark mt-3 text-xl font-extrabold text-white">ÁREA DAS EQUIPES</h1>
          <p className="mt-1 text-xs font-bold tracking-wide text-gold-400">COPA COHATRAC TF 2026</p>
        </div>
        <form onSubmit={handleSubmit} className="relative space-y-4 rounded-2xl border border-white/10 bg-white p-6 pt-9 shadow-2xl sm:p-8 sm:pt-10">
          <span className="absolute -top-5 left-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-pitch-950">
            <Shield size={18} />
          </span>
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
        <p className="mt-5 text-center text-sm text-blue-200/70">
          <Link to="/" className="hover:text-white hover:underline">
            ← Voltar ao início
          </Link>
        </p>
      </div>
    </div>
  )
}
