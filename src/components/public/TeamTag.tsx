import clsx from 'clsx'

/** Escudo + nome do time, com fallback para as iniciais quando não há escudo cadastrado. */
export function TeamTag({
  name,
  shieldUrl,
  size = 'md',
  bold = true,
  className,
}: {
  name: string
  shieldUrl?: string | null
  size?: 'sm' | 'md' | 'lg'
  bold?: boolean
  className?: string
}) {
  const dims = { sm: 'h-5 w-5 text-[9px]', md: 'h-7 w-7 text-[10px]', lg: 'h-10 w-10 text-xs' }[size]
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <span className={clsx('inline-flex min-w-0 items-center gap-2', className)}>
      {shieldUrl ? (
        <img src={shieldUrl} alt="" className={clsx(dims, 'shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm ring-1 ring-black/5')} />
      ) : (
        <span className={clsx(dims, 'flex shrink-0 items-center justify-center rounded-full bg-pitch-800 font-black text-gold-400 ring-1 ring-black/5')}>
          {initials}
        </span>
      )}
      <span className={clsx('truncate', bold && 'font-bold')}>{name}</span>
    </span>
  )
}
