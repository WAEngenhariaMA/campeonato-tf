/** Crédito de oferecimento, fixado num canto das páginas públicas. */
export function SponsorMark({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 backdrop-blur ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/60">Oferecimento</span>
      <span className="h-3 w-px bg-white/20" />
      <span className="text-xs font-black leading-none tracking-tight">
        <span className="text-[#7ed957]">VEREADOR </span>
        <span className="text-[#3b7dde]">THYAGO</span>
        <span className="text-[#f5a623]">·</span>
        <span className="text-[#7ed957]">FREITAS</span>
      </span>
    </div>
  )
}
