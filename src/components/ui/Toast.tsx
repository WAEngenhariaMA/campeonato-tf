import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

type ToastKind = 'success' | 'warning' | 'error'
interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

interface ToastState {
  notify: (kind: ToastKind, message: string) => void
  success: (message: string) => void
  warning: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastState | null>(null)

const STYLES: Record<ToastKind, string> = {
  success: 'bg-brand-600 border-brand-700',
  warning: 'bg-gold-500 border-gold-500 text-ink-950',
  error: 'bg-red-600 border-red-700',
}

const ICONS: Record<ToastKind, string> = {
  success: '✓',
  warning: '!',
  error: '✕',
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const notify = useCallback((kind: ToastKind, message: string) => {
    const id = nextId++
    setItems((prev) => [...prev, { id, kind, message }])
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }, 4500)
  }, [])

  const value: ToastState = {
    notify,
    success: (m) => notify('success', m),
    warning: (m) => notify('warning', m),
    error: (m) => notify('error', m),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={`flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium text-white shadow-lg ${STYLES[item.kind]}`}
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">
              {ICONS[item.kind]}
            </span>
            <span className="leading-snug">{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve ser usado dentro de ToastProvider.')
  return ctx
}
