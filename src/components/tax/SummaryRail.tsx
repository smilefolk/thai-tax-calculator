import { savingsFor } from '../../lib/tax/calc'
import { money, neg, pct, pctInt } from '../../lib/format'
import { useTaxReturn } from '../../store/taxReturn'
import { ProgressBar } from '../ui/Bits'
import s from './SummaryRail.module.css'

/** Suggested extra SSF/RMF: a third of the money in the marginal band, rounded to 10k, within room. */
export function useAdvice() {
  const { derived: d, cfg } = useTaxReturn()
  const m = d.marginalBracket
  const inBand = m ? d.netIncome - m.from : 0
  const room = (d.unusedAllowanceByType.ssf ?? 0) + (d.unusedAllowanceByType.rmf ?? 0)
  const amount = Math.min(room, Math.max(0, Math.round(inBand / 3 / 10_000) * 10_000))
  const saved = amount > 0 ? savingsFor(amount, d, cfg) : 0
  return { amount, saved }
}

export function SummaryRail({ estimateDeductions }: { estimateDeductions?: boolean }) {
  const { derived: d } = useTaxReturn()
  const advice = useAdvice()
  const m = d.marginalBracket
  return (
    <aside className={s.rail} aria-label="สรุปแบบเรียลไทม์" aria-live="polite">
      <div className={['eyebrow', s.eyebrow].join(' ')}>สรุปแบบเรียลไทม์</div>
      <div className={s.rows}>
        <div className={s.row}>
          <span className={s.rowLabel}>เงินได้พึงประเมิน</span>
          <span className={s.rowFig}>{money(d.grossIncome)}</span>
        </div>
        <div className={s.row}>
          <span className={s.rowLabel}>หักค่าใช้จ่าย</span>
          <span className={s.rowFig} data-muted>
            {neg(d.expenseDeduction)}
          </span>
        </div>
        <div className={s.row}>
          <span className={s.rowLabel}>
            หักค่าลดหย่อน{estimateDeductions && <small> (ประมาณการ)</small>}
          </span>
          <span className={s.rowFig} data-muted>
            {neg(d.totalDeductions)}
          </span>
        </div>
      </div>
      <div className={s.block}>
        <div className={s.blockLabel}>เงินได้สุทธิ</div>
        <div className={s.net}>{money(d.netIncome)}</div>
      </div>
      <div className={s.block} style={{ paddingBottom: 20 }}>
        <div className={s.blockLabel}>ภาษีที่ต้องชำระ</div>
        <div className={s.taxRow}>
          <span className={s.tax}>{money(d.taxDue)}</span>
          <span className={s.unit}>บาท</span>
        </div>
        <div className={s.eff}>อัตราภาษีเฉลี่ยจริง {pct(d.effectiveRate)}</div>
      </div>
      <div className={s.bracket}>
        <div className={s.bracketHead}>
          <span className={s.bracketLabel}>ขั้นภาษีปัจจุบัน</span>
          <span className={s.bracketRate}>{m ? pctInt(m.rate) : 'ยกเว้น'}</span>
        </div>
        <ProgressBar value={d.bracketProgress} label="ตำแหน่งในขั้นภาษีปัจจุบัน" />
        <div className={s.bracketNote}>
          {m && d.nextBracket ? (
            <>
              อีก <strong>{money(d.nextBracketDistance)}</strong> จะขยับขึ้นขั้น {pctInt(d.nextBracket.rate)}
            </>
          ) : m ? (
            'อยู่ในขั้นสูงสุดแล้ว'
          ) : (
            'เงินได้สุทธิยังไม่ถึงเกณฑ์เสียภาษี'
          )}
        </div>
      </div>
      {advice.amount > 0 && advice.saved > 0 && (
        <div className={s.advice}>
          <div className={s.adviceTitle}>ยังลดได้อีก</div>
          <div className={s.adviceBody}>
            ซื้อ SSF/RMF เพิ่ม <strong>{money(advice.amount)}</strong> ประหยัดภาษีได้ <em>{money(advice.saved)}</em>
          </div>
        </div>
      )}
    </aside>
  )
}

/** Narrow-viewport replacement: the rail collapses into a sticky bottom bar. */
export function SummaryBottomBar() {
  const { derived: d } = useTaxReturn()
  return (
    <div className={s.bottom} role="status" aria-live="polite">
      <div className={s.bottomLeft}>
        <span className={s.bottomLabel}>ภาษีตอนนี้</span>
        <span className={s.bottomTax}>{money(d.taxDue)}</span>
      </div>
      <div className={s.bottomMeta}>
        สุทธิ {money(d.netIncome)}
        <br />
        เฉลี่ย {pct(d.effectiveRate)}
      </div>
    </div>
  )
}
