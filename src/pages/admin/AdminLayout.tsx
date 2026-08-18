import { Outlet, useNavigate } from 'react-router-dom'
import { DashboardShell, type NavItem } from '../../components/layout/DashboardShell'
import { useAuth } from '../../auth/AuthContext'

const NAV: NavItem[] = [
  { label: 'DASHBOARD', to: '/admin', end: true },
  { label: 'TIMES', to: '/admin/times' },
  { label: 'REPRESENTANTES', to: '/admin/representantes' },
  { label: 'JOGADORES', to: '/admin/jogadores' },
  { label: 'TÉCNICOS', to: '/admin/tecnicos' },
  { label: 'DUPLICIDADES', to: '/admin/duplicidades' },
  { label: 'CONFIGURAÇÕES', to: '/admin/configuracoes' },
]

export default function AdminLayout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <DashboardShell
      brandTitle="ORGANIZAÇÃO"
      brandSubtitle="Painel administrativo"
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
