type DateLike = Date | string | { toDate: () => Date } | null | undefined

/** Firestore returns serverTimestamp() fields as Timestamp objects (not strings/Dates), so every
 * formatter here has to unwrap those too — this is the one place that needs to know that. */
function toDate(value: DateLike): Date | null {
  if (!value) return null
  if (typeof value === 'string') return new Date(value)
  if (value instanceof Date) return value
  if (typeof value === 'object' && 'toDate' in value) return value.toDate()
  return null
}

/** Formats a Date (Firestore Timestamp or ISO string also accepted) as DD/MM/AAAA. */
export function formatDate(value: DateLike): string {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d)
}

/** Formats a Date (Firestore Timestamp or ISO string also accepted) as HH:mm. */
export function formatTime(value: DateLike): string {
  const d = toDate(value)
  if (!d) return '—'
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(d)
}

export function formatDateTime(value: DateLike): string {
  return `${formatDate(value)} • ${formatTime(value)}`
}

/** Applies a Brazilian phone mask as the user types: (00) 00000-0000 / (00) 0000-0000. */
export function maskPhoneBR(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

/** Applies a CPF mask: 000.000.000-00. Documents may also be non-CPF, so this is opt-in formatting only. */
export function maskCPF(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
