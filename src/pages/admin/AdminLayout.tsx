import { Outlet, useNavigate } from 'react-router-dom'
import { DashboardShell, type NavItem } from '../../components/layout/DashboardShell'
import { useAuth } from '../../auth/AuthContext'
import { CHAMPIONSHIP_LOGO } from '../../lib/branding'

const NAV: NavItem[] = [
  { label: 'DASHBOARD', to: '/admin', end: true },
  { label: 'TIMES', to: '/admin/times' },
  { label: 'REPRESENTANTES', to: '/admin/representantes' },
  { label: 'JOGADORES', to: '/admin/jogadores' },
  { label: 'TÉCNICOS', to: '/admin/tecnicos' },
  { label: 'DUPLICIDADES', to: '/admin/duplicidades' },
  { label: 'CONFRONTOS', to: '/admin/confrontos' },
  { label: 'RESULTADOS', to: '/admin/resultados' },
  { label: 'CLASSIFICAÇÃO', to: '/admin/classificacao' },
  { label: 'CHAVEAMENTO', to: '/admin/chaveamento' },
  { label: 'CONFIGURAÇÕES', to: '/admin/configuracoes' },
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
