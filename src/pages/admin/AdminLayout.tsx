import { Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Shield, UserRound, Users, UserCog, Copy, GitBranch, ListChecks, BarChart3, Trophy, Settings } from 'lucide-react'
import { DashboardShell, type NavItem } from '../../components/layout/DashboardShell'
import { useAuth } from '../../auth/AuthContext'
import { CHAMPIONSHIP_LOGO } from '../../lib/branding'

const NAV: NavItem[] = [
  { label: 'DASHBOARD', to: '/admin', end: true, icon: LayoutDashboard },
  { label: 'TIMES', to: '/admin/times', icon: Shield },
  { label: 'REPRESENTANTES', to: '/admin/representantes', icon: UserRound },
  { label: 'JOGADORES', to: '/admin/jogadores', icon: Users },
  { label: 'TÉCNICOS', to: '/admin/tecnicos', icon: UserCog },
  { label: 'DUPLICIDADES', to: '/admin/duplicidades', icon: Copy },
  { label: 'CONFRONTOS', to: '/admin/confrontos', icon: GitBranch },
  { label: 'RESULTADOS', to: '/admin/resultados', icon: ListChecks },
  { label: 'CLASSIFICAÇÃO', to: '/admin/classificacao', icon: BarChart3 },
  { label: 'CHAVEAMENTO', to: '/admin/chaveamento', icon: Trophy },
  { label: 'CONFIGURAÇÕES', to: '/admin/configuracoes', icon: Settings },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardShell
      brandTitle="ORGANIZAÇÃO"
      brandSubtitle="Copa Cohatrac TF • 2026"
      shieldUrl={CHAMPIONSHIP_LOGO}
      navItems={NAV}
      onLogout={async () => {
        await signOut()
        navigate('/admin/login')
      }}
    >
      <Outlet />
    </DashboardShell>
  )
}
