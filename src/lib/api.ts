const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'
const tokenKey = 'campeonato-token'
const dataChangedEvent = 'campeonato:data-changed'
const dataChangedStorageKey = 'campeonato-data-version'
export const authExpiredEvent = 'campeonato:auth-expired'

export function getToken() { return localStorage.getItem(tokenKey) }
export function setToken(token: string | null) {
  if (token) localStorage.setItem(tokenKey, token)
  else localStorage.removeItem(tokenKey)
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}), ...options.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    if (response.status === 401) {
      setToken(null)
      window.dispatchEvent(new Event(authExpiredEvent))
    }
    throw new Error(body?.message ?? 'Não foi possível concluir a operação.')
  }
  const result = response.status === 204 ? undefined as T : await response.json() as T
  // Toda alteração bem-sucedida atualiza imediatamente as listas/totais já exibidos.
  // Login/senha não alteram dados das telas e não podem disparar consultas antigas antes do novo token ser salvo.
  if ((options.method ?? 'GET').toUpperCase() !== 'GET' && !path.startsWith('/auth/')) {
    window.localStorage.setItem(dataChangedStorageKey, String(Date.now()))
    window.dispatchEvent(new Event(dataChangedEvent))
  }
  return result
}

/** Atualiza imediatamente depois de mutações locais e mantém uma sincronização periódica como reserva. */
export function poll<T>(load: () => Promise<T>, callback: (data: T) => void, interval = 60_000) {
  let active = true
  const refresh = () => load().then((data) => active && callback(data)).catch(() => undefined)
  refresh()
  const id = window.setInterval(refresh, interval)
  window.addEventListener(dataChangedEvent, refresh)
  const onStorage = (event: StorageEvent) => event.key === dataChangedStorageKey && refresh()
  window.addEventListener('storage', onStorage)
  return () => {
    active = false
    window.clearInterval(id)
    window.removeEventListener(dataChangedEvent, refresh)
    window.removeEventListener('storage', onStorage)
  }
}
