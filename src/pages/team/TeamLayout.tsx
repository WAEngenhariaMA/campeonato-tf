import { Outlet, useNavigate } from 'react-router-dom'
import { DashboardShell, type NavItem } from '../../components/layout/DashboardShell'
import { useAuth } from '../../auth/AuthContext'

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
      brandSubtitle="Área da equipe"
      shieldUrl={team?.shieldUrl}
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
