import type { CSSProperties, ReactNode } from 'react'
import { money } from '../../lib/format'
import s from './Bits.module.css'
import { useMoneyField } from './useMoneyField'

export function ProgressBar({
  value,
  height = 7,
  color,
  track,
  className,
  label,
}: {
  value: number
  height?: number
  color?: string
  track?: string
  className?: string
  label?: string
}) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div
      className={[s.track, className ?? ''].join(' ')}
      style={{ height, background: track }}
      role={label ? 'progressbar' : undefined}
      aria-label={label}
      aria-valuenow={label ? Math.round(pct) : undefined}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
    >
      <div className={s.fill} style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export function Pill({
  children,
  bg,
  color,
  dot,
  style,
  size = 'sm',
}: {
  children: ReactNode
  bg: string
  color: string
  dot?: boolean
  style?: CSSProperties
  size?: 'sm' | 'md'
}) {
  const sizeStyle: CSSProperties = size === 'md' ? { padding: '6px 13px', fontSize: 12 } : {}
  return (
    <span className={s.pill} style={{ background: bg, color, ...sizeStyle, ...style }}>
      {dot && <span className={s.pillDot} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function CodeChip({ children, bg, color }: { children: ReactNode; bg: string; color: string }) {
  return (
    <span className={s.codeChip} style={{ background: bg, color }}>
      {children}
    </span>
  )
}

export function InkChip({ children }: { children: ReactNode }) {
  return <span className={s.codeChipInk}>{children}</span>
}

export function LedgerRow({
  label,
  value,
  muted,
  total,
  topRule,
  compact,
  editable,
  onChange,
  render = money,
  negative,
}: {
  label: ReactNode
  value: number
  muted?: boolean
  total?: boolean
  topRule?: boolean
  compact?: boolean
  editable?: boolean
  onChange?: (n: number) => void
  render?: (n: number) => string
  negative?: boolean
}) {
  const empty = value === 0 && !total
  const text = empty ? '—' : negative ? `−${render(value)}` : render(value)
  return (
    <div className={s.ledger} data-muted={muted || (empty && !editable)} data-total={total} data-top={topRule} data-compact={compact}>
      <span className={s.ledgerLabel}>{label}</span>
      <span className={s.leader} aria-hidden="true" />
      {editable ? (
        <span className={s.ledgerFig} data-empty={empty}>
          <LedgerInput label={typeof label === 'string' ? label : undefined} value={value} onChange={onChange ?? (() => {})} />
        </span>
      ) : (
        <span className={s.ledgerFig} data-empty={empty}>
          {text}
        </span>
      )}
    </div>
  )
}

/** Inline money editor for a ledger row — same parse/format rules as MoneyInput. */
function LedgerInput({ label, value, onChange }: { label?: string; value: number; onChange: (n: number) => void }) {
  const field = useMoneyField(value, onChange)
  return (
    <input
      className={s.ledgerInput}
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      placeholder="—"
      value={field.text}
      onFocus={field.onFocus}
      onBlur={field.onBlur}
      onChange={(e) => field.onChangeText(e.target.value)}
    />
  )
}

export function CheckMark({ checked }: { checked: boolean }) {
  return (
    <span className={s.check} data-checked={checked} aria-hidden="true">
      {checked ? '✓' : ''}
    </span>
  )
}

export function Avatar({ size = 28, onDark }: { size?: number; onDark?: boolean }) {
  return <span className={s.avatar} style={{ width: size, height: size, background: onDark ? 'rgba(255,255,255,.16)' : undefined }} aria-hidden="true" />
}
