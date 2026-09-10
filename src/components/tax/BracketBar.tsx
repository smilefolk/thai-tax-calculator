import { abbrev, money, pctInt } from '../../lib/format'
import type { BracketResult } from '../../lib/tax/types'
import s from './BracketBar.module.css'

const LIGHT = ['#E3DFD6', 'oklch(0.87 0.09 195)', 'oklch(0.70 0.13 195)', 'oklch(0.56 0.15 195)', 'oklch(0.48 0.15 195)', 'oklch(0.42 0.14 195)', 'oklch(0.36 0.12 195)', 'oklch(0.30 0.10 195)']
const LIGHT_TEXT = ['#6E6A63', 'oklch(0.35 0.11 195)', '#fff', '#fff', '#fff', '#fff', '#fff', '#fff']
const LIGHT_SUB = ['#7A756C', 'oklch(0.44 0.09 195)', 'rgba(255,255,255,.85)', 'rgba(255,255,255,.85)', 'rgba(255,255,255,.85)', 'rgba(255,255,255,.85)', 'rgba(255,255,255,.85)', 'rgba(255,255,255,.85)']
const DARK = ['rgba(255,255,255,.15)', 'oklch(0.44 0.11 195)', 'oklch(0.60 0.14 195)', 'oklch(0.80 0.13 195)', 'oklch(0.88 0.12 195)', 'oklch(0.92 0.10 195)', 'oklch(0.95 0.08 195)', 'oklch(0.97 0.05 195)']

interface Props {
  rows: BracketResult[]
  height?: number
  radius?: number
  labels?: boolean
  dark?: boolean
  /** segments below this count show even when net income is 0, so the bar never collapses */
  minSegments?: number
}

export function segments(rows: BracketResult[], minSegments = 0) {
  const reached = rows.filter((r) => r.reached && r.amountInBand > 0)
  const list = reached.length ? reached : rows.slice(0, Math.max(1, minSegments))
  const total = list.reduce((sum, r) => sum + (r.amountInBand || r.to - r.from), 0) || 1
  return list.map((r, i) => ({ r, i, width: ((r.amountInBand || r.to - r.from) / total) * 100 }))
}

export function BracketBar({ rows, height = 10, radius, labels = false, dark = false, minSegments = 4 }: Props) {
  const segs = segments(rows, minSegments)
  const palette = dark ? DARK : LIGHT
  return (
    <div className={s.bar} style={{ height, borderRadius: radius ?? (labels ? 9 : 999) }} role="img" aria-label={segs.map(({ r }) => `${pctInt(r.rate)} ${money(r.amountInBand)}`).join(', ')}>
      {segs.map(({ r, i, width }) => (
        <div key={i} className={s.seg} style={{ width: `${width}%`, background: palette[Math.min(i, palette.length - 1)], paddingLeft: labels ? 14 : 0 }}>
          {labels && (
            <>
              <span className={s.rate} style={{ color: LIGHT_TEXT[Math.min(i, 7)] }}>
                {pctInt(r.rate)}
              </span>
              <span className={s.amt} style={{ color: LIGHT_SUB[Math.min(i, 7)] }}>
                {money(r.amountInBand)}
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  )
}

/** "0 · 150K · 300K · 500K · 676K" ticks under the labelled bar */
export function BracketAxis({ rows, net }: { rows: BracketResult[]; net: number }) {
  const segs = segments(rows)
  const ticks = ['0', ...segs.slice(0, -1).map(({ r }) => abbrev(r.to)), abbrev(net)]
  return (
    <div className={s.axis} aria-hidden="true">
      {ticks.map((t, i) => (
        <span key={i}>{t}</span>
      ))}
    </div>
  )
}

/** "ขั้นบันได 0% · 5% · 10% · 15%" */
export function BracketCaption({ rows, className }: { rows: BracketResult[]; className?: string }) {
  const segs = segments(rows)
  return <div className={[s.caption, className ?? ''].join(' ')}>ขั้นบันได {segs.map(({ r }) => pctInt(r.rate)).join(' · ')}</div>
}

/** Rate labels laid out under the mobile dark bar, aligned to segment widths */
export function BracketRateRow({ rows, color }: { rows: BracketResult[]; color?: string }) {
  const segs = segments(rows)
  return (
    <div style={{ display: 'flex', font: '400 10.5px/1.4 var(--mono)', color: color ?? 'rgba(255,255,255,.68)' }} aria-hidden="true">
      {segs.map(({ r, i, width }) => (
        <span key={i} style={{ width: `${width}%` }}>
          {pctInt(r.rate)}
        </span>
      ))}
    </div>
  )
}
