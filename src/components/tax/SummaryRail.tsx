import { ssfSuggestion } from '../../lib/tax/calc'
import { money, neg, pct, pctInt } from '../../lib/format'
import { useTaxReturn } from '../../store/taxReturn'
import { ProgressBar } from '../ui/Bits'
import s from './SummaryRail.module.css'

/** The shared SSF/RMF nudge — respects every ceiling, including the combined retirement one. */
export function useAdvice() {
  const { derived: d, cfg } = useTaxReturn()
  return ssfSuggestion(d, cfg)
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
          <span className={s.bracketRate}>{m && m.rate > 0 ? pctInt(m.rate) : 'ยกเว้น'}</span>
        </div>
        <ProgressBar value={d.bracketProgress} label="ตำแหน่งในขั้นภาษีปัจจุบัน" />
        <div className={s.bracketNote}>
          {d.nextBracket ? (
            <>
              อีก <strong>{money(d.nextBracketDistance)}</strong> จะ{m && m.rate > 0 ? 'ขยับขึ้น' : 'เริ่มเสียภาษี'}ขั้น {pctInt(d.nextBracket.rate)}
            </>
          ) : (
            'อยู่ในขั้นสูงสุดแล้ว'
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
