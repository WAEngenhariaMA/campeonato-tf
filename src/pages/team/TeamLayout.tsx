import { Outlet, useNavigate } from 'react-router-dom'
import { DashboardShell, type NavItem } from '../../components/layout/DashboardShell'
import { useAuth } from '../../auth/AuthContext'
import { CHAMPIONSHIP_LOGO } from '../../lib/branding'

const NAV: NavItem[] = [
  { label: 'INÍCIO', to: '/equipes', end: true },
  { label: 'JOGADORES', to: '/equipes/jogadores' },
  { label: 'COMISSÃO TÉCNICA', to: '/equipes/comissao-tecnica' },
  { label: 'REPRESENTANTES', to: '/equipes/representantes' },
  { label: 'CONFRONTOS', to: '/equipes/confrontos' },
  { label: 'MINHA INSCRIÇÃO', to: '/equipes/inscricao' },
  { label: 'ALTERAR SENHA', to: '/equipes/senha' },
]

export default function TeamLayout() {
  const { team, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardShell
      brandTitle={team?.name ?? 'CARREGANDO...'}
      brandSubtitle="Copa Cohatrac TF • Equipe"
      shieldUrl={team?.shieldUrl ?? CHAMPIONSHIP_LOGO}
      navItems={NAV}
      onLogout={async () => {
        await signOut()
        navigate('/equipes/login')
      }}
    >
      <Outlet />
    </DashboardShell>
  )
}
