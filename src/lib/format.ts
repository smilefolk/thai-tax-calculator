const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** 1234567 → "1,234,567" (Arabic digits, per design) */
export function money(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return nf.format(Math.round(n))
}

/** Signed with the typographic minus: −100,000 / +4,100 */
export function signed(n: number, opts: { plus?: boolean } = {}): string {
  if (n < 0) return `−${money(-n)}`
  if (n > 0 && opts.plus) return `+${money(n)}`
  return money(n)
}

export function neg(n: number): string {
  return n === 0 ? '0' : `−${money(Math.abs(n))}`
}

/** 0.059 → "5.9%" */
export function pct(rate: number, digits = 1): string {
  return `${(rate * 100).toFixed(digits).replace(/\.0$/, '')}%`
}

export function pctInt(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

/** 910000 → "910K" (sidebar abbreviations) */
export function abbrev(n: number): string {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (a >= 1_000) return `${Math.round(n / 1_000)}K`
  return money(n)
}

/** Upper bound for any money field — keeps runaway keystrokes from producing absurd figures */
export const MAX_MONEY = 999_999_999

/** Parse "65,000" / "65000" / "" → number (clamped to MAX_MONEY) */
export function parseMoney(s: string): number {
  const cleaned = s.replace(/[^\d.]/g, '')
  if (!cleaned) return 0
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return 0
  return Math.min(Math.floor(n), MAX_MONEY)
}

export function bytes(n: number): string {
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`
  return `${Math.round(n / 1024)} KB`
}

export function dash(n: number, render: (v: number) => string = money): string {
  return n > 0 ? render(n) : '—'
}
