import { createRoot } from 'react-dom/client'
import './index.css'
import ConfigMissing from './ConfigMissing'

const root = createRoot(document.getElementById('root')!)

// Evita uma página em branco quando o build não recebeu a URL pública da API.
if (!import.meta.env.VITE_API_URL) {
  root.render(<ConfigMissing />)
} else {
  import('./AppRoot').then(({ default: AppRoot }) => root.render(<AppRoot />))
}
