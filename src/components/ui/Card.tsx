import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import clsx from 'clsx'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-2xl border border-ink-100 bg-white shadow-sm', className)}
      {...rest}
    />
  )
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-4', className)} {...rest} />
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx('p-5', className)} {...rest} />
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  tone = 'default',
}: {
  icon?: LucideIcon
  label: string
  value: string
  sublabel?: string
  tone?: 'default' | 'brand' | 'gold' | 'danger'
}) {
  const toneClass = {
    default: 'text-ink-900',
    brand: 'text-brand-600',
    gold: 'text-gold-500',
    danger: 'text-red-600',
  }[tone]
  const iconToneClass = {
    default: 'bg-ink-100 text-ink-500',
    brand: 'bg-brand-100 text-brand-600',
    gold: 'bg-gold-400/15 text-gold-500',
    danger: 'bg-red-100 text-red-600',
  }[tone]

  return (
    <Card className="flex h-[104px] items-center gap-3.5 p-5">
      {Icon && (
        <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', iconToneClass)}>
          <Icon size={22} strokeWidth={2.25} />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
        <p className={clsx('mt-1 text-2xl font-bold leading-none tabular-nums', toneClass)}>{value}</p>
        {sublabel && <p className="mt-1 truncate text-xs text-ink-400">{sublabel}</p>}
      </div>
    </Card>
  )
}
