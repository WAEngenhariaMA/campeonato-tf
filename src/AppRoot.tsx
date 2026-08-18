import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import { AuthProvider } from './auth/AuthContext'
import { ToastProvider } from './components/ui/Toast'

/**
 * Carregado depois de confirmar a URL da API para que uma configuração ausente
 * mostre a tela de orientação em vez de uma página em branco.
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
