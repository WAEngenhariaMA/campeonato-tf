import { Outlet, useNavigate } from 'react-router-dom'
import { Home, Users, UserCog, Contact, GitBranch, ClipboardList, KeyRound } from 'lucide-react'
import { DashboardShell, type NavItem } from '../../components/layout/DashboardShell'
import { useAuth } from '../../auth/AuthContext'
import { CHAMPIONSHIP_LOGO } from '../../lib/branding'
import { resolveTeamShield } from '../../lib/teamAssets'

const NAV: NavItem[] = [
  { label: 'INÍCIO', to: '/equipes', end: true, icon: Home },
  { label: 'JOGADORES', to: '/equipes/jogadores', icon: Users },
  { label: 'COMISSÃO TÉCNICA', to: '/equipes/comissao-tecnica', icon: UserCog },
  { label: 'REPRESENTANTES', to: '/equipes/representantes', icon: Contact },
  { label: 'CONFRONTOS', to: '/equipes/confrontos', icon: GitBranch },
  { label: 'MINHA INSCRIÇÃO', to: '/equipes/inscricao', icon: ClipboardList },
  { label: 'ALTERAR SENHA', to: '/equipes/senha', icon: KeyRound },
]

export default function TeamLayout() {
  const { team, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardShell
      brandTitle={team?.name ?? 'CARREGANDO...'}
      brandSubtitle="Copa Cohatrac TF • Equipe"
      shieldUrl={(team && resolveTeamShield(team)) ?? CHAMPIONSHIP_LOGO}
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
