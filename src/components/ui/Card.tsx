import type { HTMLAttributes } from 'react'
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
  label,
  value,
  sublabel,
  tone = 'default',
}: {
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

  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={clsx('mt-2 text-3xl font-bold tabular-nums', toneClass)}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-ink-400">{sublabel}</p>}
    </Card>
  )
}
