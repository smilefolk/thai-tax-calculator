import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PhoneTabBar } from '../components/layout/PhoneTabBar'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { Slider } from '../components/ui/Slider'
import { useIsMobile } from '../hooks/useMediaQuery'
import { dash, money } from '../lib/format'
import { derive, savingsFor } from '../lib/tax/calc'
import { buildPlans, retirementRoom, savingsCurve, type Liquidity, type PlanOutcome } from '../lib/tax/plans'
import { useTaxReturn } from '../store/taxReturn'
import s from './Plan.module.css'

const LIQ: Record<Liquidity, string> = { high: 'สูงสุด', medium: 'ปานกลาง', low: 'ต่ำ' }

/** hue drifts teal → ochre → clay as locked capital grows */
function barColor(t: number): string {
  if (t < 0.55) {
    const L = 0.9 - t * 0.62
    const C = 0.05 + t * 0.18
    return `oklch(${L.toFixed(2)} ${Math.min(0.15, C).toFixed(3)} 195)`
  }
  if (t < 0.65) return 'oklch(0.60 0.14 90)'
  if (t < 0.75) return 'oklch(0.62 0.15 60)'
  return 'oklch(0.60 0.16 45)'
}

function DesktopPlan() {
  const { derived: current, cfg, ret, dispatch } = useTaxReturn()
  const applied = ret.appliedPlan
  // plans are always built from the pre-plan baseline, so applying one never stacks
  const d = useMemo(() => (applied ? derive({ ...ret, deductions: { ...ret.deductions, ...applied.baseline } }, cfg) : current), [applied, ret, cfg, current])
  const plans = useMemo(() => buildPlans(d, cfg), [d, cfg])
  const c = plans[2]
  const b = plans[1]
  const maxLocked = Math.max(c.locked, b.locked, 1)
  const curve = useMemo(() => savingsCurve(d, cfg, maxLocked, 20), [d, cfg, maxLocked])

  const choose = (p: PlanOutcome) =>
    dispatch({ type: 'applyPlan', id: p.id, extras: { ssfExtra: p.ssfExtra, rmfExtra: p.rmfExtra, lifeExtra: p.lifeExtra, donation: p.donation } })

  return (
    <div className={s.page}>
      <div className="page__inner">
        <TopBar />
        <div className={s.inner}>
          <div className={s.head}>
            <div>
              <div className="eyebrow">วางแผนภาษี · ปีภาษี {ret.taxYear}</div>
              <h1 className={s.h1}>ประหยัดภาษีได้เท่าไหร่ แลกกับเงินที่ต้องล็อกไว้แค่ไหน</h1>
              <p className={s.lead}>ทุกแผนคำนวณจากเงินได้สุทธิ {money(d.netIncome)} บาทเท่ากัน ต่างกันแค่จำนวนเงินที่คุณเอาไปลงในสิทธิลดหย่อน</p>
            </div>
            <div className={s.headBtns}>
              <Button variant="secondary" size="sm" to="/calc/deductions">
                สร้างแผนเอง
              </Button>
              <Button variant="dark" size="md" style={{ fontSize: 12.5 }} onClick={() => window.print()}>
                ส่งให้ที่ปรึกษาดู
              </Button>
            </div>
          </div>

          {applied && (
            <div role="status" className={s.appliedNote}>
              <span>
                ใช้แผน {applied.id} อยู่ — ค่าลดหย่อนในร่างรวมแผนนี้แล้ว ภาษีใหม่ <strong className="num">{money(current.taxDue)}</strong> บาท
              </span>
              <span className={s.appliedActions}>
                <Link to="/result">ดูผลลัพธ์ →</Link>
                <button type="button" onClick={() => dispatch({ type: 'clearPlan' })}>
                  ยกเลิกแผน
                </button>
              </span>
            </div>
          )}

          <div className={s.grid}>
            {plans.map((p) => (
              <article key={p.id} className={s.plan} data-rec={p.recommended} data-applied={applied?.id === p.id} aria-label={`แผน ${p.id} ${p.name}`}>
                <div className={s.pHead}>
                  <div className={s.pEyebrowRow}>
                    <span className={s.pEyebrow}>แผน {p.id}</span>
                    {applied?.id === p.id ? (
                      <span style={{ font: '600 10.5px/1.4 var(--sans)', color: '#fff', background: 'var(--ink)', padding: '4px 10px', borderRadius: 999 }}>ใช้อยู่</span>
                    ) : (
                      p.recommended && <span style={{ font: '600 10.5px/1.4 var(--sans)', color: '#fff', background: 'var(--teal)', padding: '4px 10px', borderRadius: 999 }}>แนะนำ</span>
                    )}
                  </div>
                  <div className={s.pName}>{p.name}</div>
                  <div className={s.pBlurb}>{p.blurb}</div>
                </div>
                <div className={s.pInputs}>
                  {(
                    [
                      ['SSF เพิ่ม', p.ssfExtra],
                      ['RMF', p.rmfExtra],
                      ['ประกันชีวิตเพิ่ม', p.lifeExtra],
                      ['บริจาค', p.donation],
                    ] as const
                  ).map(([label, v]) => (
                    <div key={label} className={s.pRow}>
                      <span className={s.pRowLabel}>{label}</span>
                      <span className={s.pRowFig} data-empty={v === 0}>
                        {dash(v)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className={s.pOut}>
                  <div className={s.pOutLabel}>ภาษีที่ต้องจ่าย</div>
                  <div className={s.pTaxRow}>
                    <span className={s.pTax}>{money(p.tax)}</span>
                    {p.saved > 0 && <span className={s.pStruck}>{money(d.taxDue)}</span>}
                  </div>
                  <div className={s.pStats}>
                    <div className={s.pStat}>
                      <span className={s.pStatLabel}>ประหยัดได้</span>
                      <span className={s.pStatFig} style={{ color: p.saved > 0 ? 'var(--green-deep)' : undefined }}>
                        {money(p.saved)}
                      </span>
                    </div>
                    <div className={s.pStat}>
                      <span className={s.pStatLabel}>เงินที่ต้องล็อก</span>
                      <span className={s.pStatFig} style={{ color: p.liquidity === 'low' ? 'var(--clay-mid)' : undefined }}>
                        {money(p.locked)}
                      </span>
                    </div>
                    <div className={s.pStat}>
                      <span className={s.pStatLabel}>สภาพคล่องคงเหลือ</span>
                      <span className={s.pStatFig} style={{ color: p.liquidity === 'low' ? 'var(--clay-mid)' : undefined }}>
                        {LIQ[p.liquidity]}
                      </span>
                    </div>
                  </div>
                  {p.id !== 'A' && (
                    <div className={s.pCta}>
                      {applied?.id === p.id ? (
                        <Button variant="secondary" block style={{ padding: '13px 0', fontSize: 13.5 }} onClick={() => dispatch({ type: 'clearPlan' })}>
                          ยกเลิกแผนนี้
                        </Button>
                      ) : (
                        <Button variant={p.recommended ? 'primary' : 'secondaryInk'} block style={{ padding: '13px 0', fontSize: 13.5 }} onClick={() => choose(p)}>
                          {applied ? 'เปลี่ยนมาใช้แผนนี้' : 'เลือกแผนนี้'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <section className={s.chart} aria-labelledby="curve-h">
            <div className={s.chartHead}>
              <h2 id="curve-h" className={s.chartTitle}>
                ภาษีที่ประหยัดได้ เทียบกับเงินที่ต้องล็อก
              </h2>
              <span className={s.chartSub}>ยิ่งไปทางขวา ยิ่งต้องล็อกเงินมากขึ้นเพื่อประหยัดเพิ่มทีละน้อย</span>
            </div>
            <div className={s.bars} role="img" aria-label={`เส้นโค้งการประหยัดภาษี จาก 0 ถึง ${money(maxLocked)} บาท`}>
              {curve.map((p, i) => (
                <div key={i} className={s.bar} style={{ height: `${Math.max(2, p.height * 100)}%`, background: barColor(i / (curve.length - 1)) }} title={`ล็อก ${money(p.locked)} → ประหยัด ${money(p.saved)}`} />
              ))}
            </div>
            <div className={s.axis}>
              <span>ล็อก 0</span>
              <span>
                <b style={{ color: 'var(--teal-deep)' }}>แผน B · {money(b.locked)}</b>
              </span>
              <span>{money(Math.round(maxLocked / 2 / 1000) * 1000)}</span>
              <span>
                <b style={{ color: 'var(--clay-mid)' }}>แผน C · {money(c.locked)}</b>
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function MobilePlan() {
  const { derived: d, cfg } = useTaxReturn()
  const max = Math.max(0, Math.floor(retirementRoom(d, cfg) / 1000) * 1000)
  const [extra, setExtra] = useState(() => Math.min(max, 60_000))
  const saved = savingsFor(extra, d, cfg)
  const newTax = d.taxDue - saved
  return (
    <div className={s.m}>
      <main className={s.mBody}>
        <h2 className={s.mH2}>ลองปรับดูสิ</h2>
        <p className={s.mLead}>เลื่อนดูว่าซื้อกองทุนเพิ่มแล้วภาษีลดเท่าไหร่</p>

        <div className={s.mSlider}>
          <div className={s.mSliderHead}>
            <span className={s.mSliderLabel}>ซื้อ SSF/RMF เพิ่ม</span>
            <span className={s.mSliderFig}>{money(extra)}</span>
          </div>
          <Slider value={extra} min={0} max={max || 1000} step={1000} onChange={setExtra} size="lg" ariaLabel="ซื้อ SSF/RMF เพิ่ม" valueText={(n) => `${money(n)} บาท`} />
          <div className={s.mScale}>
            <span>0</span>
            <span>สิทธิสูงสุด {money(max)}</span>
          </div>
        </div>

        <div className={s.mResult} role="status" aria-live="polite">
          <div className={s.mResultLabel}>ภาษีจะเหลือ</div>
          <div className={s.mResultRow}>
            <span className={s.mResultFig}>{money(newTax)}</span>
            {saved > 0 && <span className={s.mResultStruck}>{money(d.taxDue)}</span>}
          </div>
          <span className={s.mSave}>ประหยัด {money(saved)} บาท</span>
        </div>

        <div className={s.mList}>
          <Link to="/calc/q/10" className={s.mItem}>
            <span className={s.mIcon} aria-hidden="true" />
            <span style={{ flex: 1 }}>
              <span className={s.mItemTitle} style={{ display: 'block' }}>
                เงินบริจาค
              </span>
              <span className={s.mItemSub}>ลดหย่อนได้ 1–2 เท่า</span>
            </span>
            <span className={s.mChev} aria-hidden="true">
              ›
            </span>
          </Link>
          <Link to="/calc/q/9" className={s.mItem}>
            <span className={s.mIcon} aria-hidden="true" />
            <span style={{ flex: 1 }}>
              <span className={s.mItemTitle} style={{ display: 'block' }}>
                ดอกเบี้ยบ้าน
              </span>
              <span className={s.mItemSub}>สูงสุด {money(cfg.caps.homeLoanInterest)}</span>
            </span>
            <span className={s.mChev} aria-hidden="true">
              ›
            </span>
          </Link>
        </div>
      </main>
      <PhoneTabBar active="วางแผน" />
    </div>
  )
}

export function Plan() {
  const mobile = useIsMobile()
  return mobile ? <MobilePlan /> : <DesktopPlan />
}
