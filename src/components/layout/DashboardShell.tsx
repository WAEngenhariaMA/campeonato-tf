import { type ReactNode, useState } from 'react'
import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { CHAMPIONSHIP_LOGO } from '../../lib/branding'

export interface NavItem {
  label: string
  to: string
  end?: boolean
}

export function DashboardShell({
  brandTitle,
  brandSubtitle,
  shieldUrl,
  navItems,
  onLogout,
  children,
}: {
  brandTitle: string
  brandSubtitle: string
  shieldUrl?: string | null
  navItems: NavItem[]
  onLogout: () => void
  children: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            clsx(
              'rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors',
              isActive ? 'bg-brand-600 text-white' : 'text-ink-200 hover:bg-ink-800 hover:text-white',
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )

  const brand = (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
      {shieldUrl ? (
        <img src={shieldUrl ?? CHAMPIONSHIP_LOGO} alt="Logo da Copa Cohatrac TF" className="h-12 w-12 shrink-0 rounded-xl border border-gold-400/70 bg-pitch-950 object-contain p-0.5 shadow-lg" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
          ⚽
        </div>
      )}
      <div className="min-w-0">
        <p className="championship-wordmark truncate text-sm font-extrabold text-white">{brandTitle}</p>
        <p className="truncate text-xs text-gold-400">{brandSubtitle}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-svh bg-[#f3f6fb] md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-pitch-950 shadow-2xl md:flex">
        {brand}
        {nav}
        <div className="border-t border-ink-800 p-3">
          <button
            onClick={onLogout}
            className="w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-ink-200 hover:bg-ink-800 hover:text-white"
          >
            SAIR
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-gold-400/30 bg-pitch-950 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          {shieldUrl ? (
            <img src={shieldUrl ?? CHAMPIONSHIP_LOGO} alt="Logo da Copa Cohatrac TF" className="h-9 w-9 rounded-lg border border-gold-400/70 bg-pitch-950 object-contain p-0.5" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm text-white">⚽</div>
          )}
          <p className="championship-wordmark text-sm font-extrabold text-white">{brandTitle}</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-ink-800"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-pitch-950 shadow-xl">
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:bg-ink-800 hover:text-white"
              >
                ✕
              </button>
            </div>
            {nav}
            <div className="border-t border-ink-800 p-3">
              <button
                onClick={onLogout}
                className="w-full rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-ink-200 hover:bg-ink-800 hover:text-white"
              >
                SAIR
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
