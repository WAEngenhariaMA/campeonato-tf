import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'
import clsx from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(({ label, error, hint, className, id, ...rest }, ref) => {
  const inputId = id ?? rest.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-300',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
          error ? 'border-red-400' : 'border-ink-200',
          className,
        )}
        {...rest}
      />
      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-ink-400">{hint}</p>
      ) : null}
    </div>
  )
})
Input.displayName = 'Input'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    const selectId = id ?? rest.name
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-ink-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-ink-900 outline-none transition-colors',
            'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
            error ? 'border-red-400' : 'border-ink-200',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    )
  },
)
Select.displayName = 'Select'
