import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, GitBranch, Award, History, ScrollText, ArrowLeft, Menu, X, Wifi } from 'lucide-react'
import { resolveChampionshipLogo } from '../../lib/branding'
import { formatTime } from '../../lib/format'
import type { TabKey } from '../../pages/public/PublicTournamentPanel.types'

const NAV: { key: TabKey; label: string; icon: typeof BarChart3 }[] = [
  { key: 'classificacao', label: 'Classificação', icon: BarChart3 },
  { key: 'jogos', label: 'Jogos', icon: GitBranch },
  { key: 'artilharia', label: 'Artilharia', icon: Award },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'criterios', label: 'Critérios', icon: ScrollText },
]

function Brand({ logoUrl, name }: { logoUrl: string; name: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
      <img src={logoUrl} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-gold-400/40" />
      <div className="min-w-0">
        <p className="championship-wordmark truncate text-sm font-extrabold text-white">{name}</p>
        <p className="truncate text-xs text-gold-400">Painel Oficial</p>
      </div>
    </div>
  )
}

function NavList({ tab, onSelect }: { tab: TabKey; onSelect: (tab: TabKey) => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const Icon = item.icon
        const active = tab === item.key
        return (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
              active ? 'bg-brand-600 text-white' : 'text-ink-200 hover:bg-ink-800 hover:text-white'
            }`}
          >
            <Icon size={18} strokeWidth={2.25} />
            {item.label}
          </button>
        )
      })}
      <Link
        to="/"
        className="mt-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
      >
        <ArrowLeft size={18} strokeWidth={2.25} />
        Início
      </Link>
    </nav>
  )
}

function SyncIndicator({ lastSync }: { lastSync: Date | null }) {
  return (
    <div className="border-t border-white/10 px-5 py-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Base online sincronizada
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-400">
        <Wifi size={12} />
        Atualizado às {lastSync ? formatTime(lastSync) : '—'}
      </p>
    </div>
  )
}

export function PublicSidebar({
  tab,
  onSelect,
  logoUrl,
  championshipName,
  lastSync,
  children,
}: {
  tab: TabKey
  onSelect: (tab: TabKey) => void
  logoUrl: string
  championshipName: string
  lastSync: Date | null
  children: ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const resolvedLogo = resolveChampionshipLogo(logoUrl)

  return (
    <div className="min-h-svh bg-[#f4f7fc] md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-pitch-950 shadow-2xl md:flex">
        <Brand logoUrl={resolvedLogo} name={championshipName} />
        <NavList tab={tab} onSelect={onSelect} />
        <SyncIndicator lastSync={lastSync} />
      </aside>

      <div className="flex items-center justify-between border-b border-gold-400/20 bg-pitch-950 px-4 py-3 md:hidden">
        <div className="flex items-center gap-2.5">
          <img src={resolvedLogo} alt="" className="h-8 w-8 rounded-lg object-cover" />
          <p className="championship-wordmark text-sm font-extrabold text-white">{championshipName}</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-ink-800"
        >
          <Menu size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <div className="absolute inset-0 bg-ink-950/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-pitch-950 shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand logoUrl={resolvedLogo} name={championshipName} />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-300 hover:bg-ink-800 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            <NavList
              tab={tab}
              onSelect={(next) => {
                onSelect(next)
                setMobileOpen(false)
              }}
            />
            <SyncIndicator lastSync={lastSync} />
          </div>
        </div>
      )}

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
