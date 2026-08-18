import { Route, Routes } from 'react-router-dom'
import Home from './pages/public/Home'
import RepresentativeRegistration from './pages/public/RepresentativeRegistration'
import TeamLogin from './pages/team/TeamLogin'
import TeamLayout from './pages/team/TeamLayout'
import TeamHome from './pages/team/TeamHome'
import TeamPlayers from './pages/team/TeamPlayers'
import TeamCoaches from './pages/team/TeamCoaches'
import TeamRepresentatives from './pages/team/TeamRepresentatives'
import TeamMatches from './pages/team/TeamMatches'
import TeamRegistrationSummary from './pages/team/TeamRegistrationSummary'
import TeamChangePassword from './pages/team/TeamChangePassword'
import AdminLogin from './pages/admin/AdminLogin'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTeams from './pages/admin/AdminTeams'
import AdminRepresentatives from './pages/admin/AdminRepresentatives'
import AdminPlayers from './pages/admin/AdminPlayers'
import AdminCoaches from './pages/admin/AdminCoaches'
import AdminDuplicates from './pages/admin/AdminDuplicates'
import AdminConfig from './pages/admin/AdminConfig'
import { Protected } from './components/layout/Protected'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/representantes" element={<RepresentativeRegistration />} />

      <Route path="/equipes/login" element={<TeamLogin />} />
      <Route
        path="/equipes"
        element={
          <Protected role="team" redirectTo="/equipes/login">
            <TeamLayout />
          </Protected>
        }
      >
        <Route index element={<TeamHome />} />
        <Route path="jogadores" element={<TeamPlayers />} />
        <Route path="comissao-tecnica" element={<TeamCoaches />} />
        <Route path="representantes" element={<TeamRepresentatives />} />
        <Route path="confrontos" element={<TeamMatches />} />
        <Route path="inscricao" element={<TeamRegistrationSummary />} />
        <Route path="senha" element={<TeamChangePassword />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <Protected role="admin" redirectTo="/admin/login">
            <AdminLayout />
          </Protected>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="times" element={<AdminTeams />} />
        <Route path="representantes" element={<AdminRepresentatives />} />
        <Route path="jogadores" element={<AdminPlayers />} />
        <Route path="tecnicos" element={<AdminCoaches />} />
        <Route path="duplicidades" element={<AdminDuplicates />} />
        <Route path="configuracoes" element={<AdminConfig />} />
      </Route>

      <Route path="*" element={<Home />} />
    </Routes>
  )
}
