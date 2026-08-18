import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/ui/Toast'

/**
 * Split out from main.tsx on purpose: this is the first module to import AuthContext,
 * which imports lib/firebase.ts, whose top-level getAuth()/getFirestore() calls throw
 * synchronously when the Firebase env vars are empty (e.g. GitHub secrets not set yet).
 * main.tsx only imports this file after confirming the config is present, so a missing
 * config shows the ConfigMissing screen instead of crashing to a blank page.
 */
export default function AppRoot() {
  return (
    <StrictMode>
      <BrowserRouter basename="/campeonato-tf">
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>
  )
}
