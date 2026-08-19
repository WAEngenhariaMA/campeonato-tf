import clsx from 'clsx'
import { resolveTeamShield } from '../../lib/teamAssets'

/** Escudo + nome do time. Resolve o escudo por team.shieldUrl e, na falta dele, pelo
 * mapeamento em public/escudos/; sem nenhum dos dois, cai para as iniciais do nome. */
export function TeamBadge({
  name,
  shieldUrl,
  size = 'md',
  bold = true,
  className,
}: {
  name: string
  shieldUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  bold?: boolean
  className?: string
}) {
  const resolved = resolveTeamShield({ name, shieldUrl })
  const dims = {
    xs: 'h-4 w-4 text-[8px]',
    sm: 'h-6 w-6 text-[9px]',
    md: 'h-8 w-8 text-[10px]',
    lg: 'h-11 w-11 text-xs',
    xl: 'h-16 w-16 text-sm',
  }[size]
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')

  return (
    <span className={clsx('inline-flex min-w-0 items-center gap-2', className)}>
      {resolved ? (
        <img src={resolved} alt="" className={clsx(dims, 'shrink-0 rounded-full bg-white object-contain p-0.5 shadow ring-1 ring-black/5')} />
      ) : (
        <span className={clsx(dims, 'flex shrink-0 items-center justify-center rounded-full bg-pitch-800 font-black text-gold-400 ring-1 ring-black/5')}>
          {initials}
        </span>
      )}
      <span className={clsx('truncate', bold && 'font-bold')}>{name}</span>
    </span>
  )
}

/** Só o escudo, sem nome — usado em espaços apertados (bracket, cabeçalho do modal). */
export function TeamShield({
  name,
  shieldUrl,
  size = 'md',
  className,
}: {
  name: string
  shieldUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const resolved = resolveTeamShield({ name, shieldUrl })
  const dims = {
    xs: 'h-5 w-5 text-[8px]',
    sm: 'h-7 w-7 text-[9px]',
    md: 'h-9 w-9 text-[10px]',
    lg: 'h-14 w-14 text-sm',
    xl: 'h-20 w-20 text-base',
  }[size]
  const initials = name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('')

  return resolved ? (
    <img src={resolved} alt={name} title={name} className={clsx(dims, className, 'shrink-0 rounded-full bg-white object-contain p-0.5 shadow ring-1 ring-black/5')} />
  ) : (
    <span title={name} className={clsx(dims, className, 'flex shrink-0 items-center justify-center rounded-full bg-pitch-800 font-black text-gold-400 ring-1 ring-black/5')}>
      {initials}
    </span>
  )
}
