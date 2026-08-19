import type { LucideIcon } from 'lucide-react'

/** Card de estatística para o header escuro do painel público — mesma altura/padding sempre. */
export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
}: {
  icon: LucideIcon
  label: string
  value: string
  sublabel?: string
}) {
  return (
    <div className="flex h-[92px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] px-4 py-3 backdrop-blur">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-400/15 text-gold-400 ring-1 ring-gold-400/30">
        <Icon size={22} strokeWidth={2.25} />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-[.14em] text-blue-200">{label}</p>
        <p className="mt-0.5 text-xl font-black leading-none text-white">{value}</p>
        {sublabel && <p className="mt-1 truncate text-[11px] text-blue-100/70">{sublabel}</p>}
      </div>
    </div>
  )
}
