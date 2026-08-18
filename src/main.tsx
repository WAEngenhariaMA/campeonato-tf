import { createRoot } from 'react-dom/client'
import './index.css'
import ConfigMissing from './ConfigMissing'

const root = createRoot(document.getElementById('root')!)

// Checked here, before anything imports lib/firebase.ts — that module's top-level
// getAuth()/getFirestore() calls throw synchronously on an empty apiKey, which would
// otherwise crash the whole render to a blank page instead of showing a clear message.
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  root.render(<ConfigMissing />)
} else {
  import('./AppRoot').then(({ default: AppRoot }) => root.render(<AppRoot />))
}
