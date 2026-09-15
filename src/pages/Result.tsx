import { PhoneTabBar } from '../components/layout/PhoneTabBar'
import { TopBar } from '../components/layout/TopBar'
import { BracketAxis, BracketBar, BracketRateRow } from '../components/tax/BracketBar'
import { CheckMark, ProgressBar } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { Logo } from '../components/ui/Logo'
import { priorYearFor } from '../data/history'
import { useIsMobile } from '../hooks/useMediaQuery'
import { money, pct, pctInt } from '../lib/format'
import { ssfSuggestion } from '../lib/tax/calc'
import { useTaxReturn } from '../store/taxReturn'
import s from './Result.module.css'
import { TOTAL_QUESTIONS } from './wizard/questions'

function useAdviceCards() {
  const { derived: d, cfg, ret } = useTaxReturn()
  const it = (k: string) => d.deductionItems.find((i) => i.key === k)!
  const ssf = it('ssf')
  const rmf = it('rmf')
  const life = it('lifeInsurance')
  const health = it('healthInsurance')
  // the same nudge the rail shows — capped by the combined retirement ceiling
  const suggest = ssfSuggestion(d, cfg)
  return {
    ssf: { used: ssf.allowed, cap: ssf.cap, suggest: Math.min(suggest.amount, ssf.cap - ssf.allowed), saved: suggest.saved },
    rmf: { used: rmf.allowed, cap: rmf.cap },
    // health insurance shares the 100,000 ceiling, so it counts as "used" here
    life: { used: life.allowed + health.allowed, cap: life.cap, entered: ret.deductions.lifeInsurance + ret.deductions.healthInsurance, room: d.unusedAllowanceByType.lifeInsurance ?? 0 },
  }
}

function DesktopResult() {
  const { derived: d, ret, cfg } = useTaxReturn()
  const abs = Math.abs(d.balance)
  const adv = useAdviceCards()
  const last = priorYearFor(ret.taxYear)
  const delta = last ? d.taxDue - last.tax : 0
  const maxBar = Math.max(d.taxDue, last?.tax ?? 0) || 1
  const docs = [
    { label: 'หนังสือรับรองหัก ณ ที่จ่าย 50 ทวิ', done: ret.attachments.some((a) => a.kind === 'withholding-cert' && a.status === 'verified'), need: true },
    { label: 'หนังสือรับรองเบี้ยประกันชีวิต', done: ret.attachments.some((a) => a.kind === 'life-insurance' && a.status === 'verified'), need: ret.deductions.lifeInsurance > 0 },
    { label: 'หนังสือรับรองการซื้อ SSF', done: ret.attachments.some((a) => a.kind === 'ssf' && a.status === 'verified'), need: ret.deductions.ssf > 0 },
  ].filter((x) => x.need)
  const reachedCount = d.taxByBracket.filter((r) => r.reached).length

  return (
    <div className={s.page}>
      <div className="page__inner">
        <TopBar />
      </div>
      <div className={s.inner}>
        <div className={s.head}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 9 }}>
              ผลการคำนวณ · ปีภาษี {ret.taxYear}
            </div>
            <h1 className={s.h1}>
              ปีนี้คุณจ่ายภาษี <span className="num">{money(d.taxDue)}</span> บาท
            </h1>
          </div>
          <div className={s.headBtns}>
            <Button variant="secondary" size="md" style={{ borderRadius: 9 }} to="/calc/summary">
              ← แก้ไขข้อมูล
            </Button>
            <Button variant="secondary" size="md" style={{ borderRadius: 9 }} onClick={() => navigator.share?.({ title: 'ผลคำนวณภาษี', text: `ภาษีปี ${ret.taxYear} ของฉัน ${money(d.taxDue)} บาท` }).catch(() => {})}>
              แชร์ผล
            </Button>
            <Button variant="dark" size="md" style={{ borderRadius: 9, padding: '12px 22px' }} onClick={() => window.print()}>
              บันทึกเป็น PDF
            </Button>
          </div>
        </div>

        {d.verdict === 'refund' && (
          <div className={s.banner} data-tone="refund" role="status">
            <div className={s.bannerIcon} style={{ background: 'var(--green)' }}>
              ↓
            </div>
            <div style={{ flex: 1 }}>
              <div className={s.bannerTitle}>
                คุณขอคืนภาษีได้ <span className="num">{money(abs)}</span> บาท
              </div>
              <div className={s.bannerSub}>
                นายจ้างหัก ณ ที่จ่ายไว้ {money(d.withholding)} มากกว่าภาษีจริง {money(d.taxDue)} — ยื่นขอคืนได้ทันทีเมื่อเปิดระบบ
              </div>
            </div>
            <Button variant="green" size="md" to="/file">
              วิธีขอคืน
            </Button>
          </div>
        )}
        {d.verdict === 'owed' && (
          <div className={s.banner} data-tone="owed" role="status">
            <div className={s.bannerIcon} style={{ background: 'var(--clay-strong)' }}>
              !
            </div>
            <div style={{ flex: 1 }}>
              <div className={s.bannerTitle}>
                คุณต้องชำระเพิ่ม <span className="num">{money(abs)}</span> บาท
              </div>
              <div className={s.bannerSub}>
                {abs >= cfg.instalmentThreshold ? `ผ่อนได้ 3 งวดโดยไม่มีดอกเบี้ย เพราะยอดเกิน ${money(cfg.instalmentThreshold)} บาท` : `หัก ณ ที่จ่ายไว้ ${money(d.withholding)} น้อยกว่าภาษีจริง ${money(d.taxDue)} — ชำระได้ทันทีตอนยื่นแบบ`}
              </div>
            </div>
            <Button variant="clay" size="md" style={{ background: 'var(--clay-btn)' }} to="/file">
              ช่องทางชำระ
            </Button>
          </div>
        )}
        {d.verdict === 'even' && (
          <div className={s.banner} data-tone="even" role="status">
            <div className={s.bannerIcon} style={{ background: 'var(--ink-ghost)' }}>
              =
            </div>
            <div style={{ flex: 1 }}>
              <div className={s.bannerTitle}>{d.taxDue === 0 ? 'ปีนี้คุณไม่ต้องเสียภาษี' : 'หัก ณ ที่จ่ายไว้พอดีกับภาษีที่ต้องชำระ'}</div>
              <div className={s.bannerSub} style={{ color: 'var(--ink-muted)' }}>
                {d.taxDue === 0 ? 'เงินได้สุทธิยังไม่ถึงเกณฑ์ 150,000 บาท แต่ยังต้องยื่นแบบถ้ามีรายได้เกินเกณฑ์' : 'ไม่มียอดขอคืนหรือชำระเพิ่ม'}
              </div>
            </div>
          </div>
        )}

        <div className={s.cols}>
          <div className={s.col}>
            <section className={s.card} aria-labelledby="br-h">
              <h2 id="br-h" className={s.cardTitle}>
                เงินได้สุทธิ {money(d.netIncome)} ถูกซอยเป็น {reachedCount} ขั้น
              </h2>
              <div className={s.cardSub}>ภาษีไทยเป็นแบบขั้นบันได เงินก้อนแรกได้รับยกเว้น ส่วนที่เกินจึงคิดอัตราสูงขึ้นทีละขั้น</div>
              <BracketBar rows={d.taxByBracket} height={62} labels minSegments={1} />
              <div className={s.axis}>
                <BracketAxis rows={d.taxByBracket} net={d.netIncome} />
              </div>
              <div className={s.thead} role="row">
                <span>ช่วงเงินได้สุทธิ</span>
                <span>อัตรา</span>
                <span style={{ textAlign: 'right' }}>เงินในขั้น</span>
                <span style={{ textAlign: 'right' }}>ภาษี</span>
              </div>
              {d.taxByBracket.map((r, i) => (
                <div key={i} className={s.tr} data-unreached={!r.reached} data-active={r.isMarginal} role="row">
                  <span>{Number.isFinite(r.to) ? `${money(r.from === 0 ? 0 : r.from + 1)} – ${money(r.to)}` : `${money(r.from + 1)} ขึ้นไป`}</span>
                  <span className={s.rate}>{r.rate === 0 ? 'ยกเว้น' : pctInt(r.rate)}</span>
                  <span className={s.amt}>{r.reached ? money(r.amountInBand) : '—'}</span>
                  <span className={s.tax}>{r.reached ? money(r.tax) : '—'}</span>
                </div>
              ))}
              <div className={s.total}>
                <span className={s.totalLabel}>รวมภาษีทั้งสิ้น</span>
                <span className={s.totalFig}>{money(d.taxDue)}</span>
              </div>
            </section>

            <section className={s.card} aria-labelledby="adv-h">
              <div className={s.adviceHead}>
                <div>
                  <h2 id="adv-h" className={s.cardTitle} style={{ marginBottom: 3 }}>
                    ถ้าอยากลดภาษีปีหน้า
                  </h2>
                  <div className={s.cardSub} style={{ margin: 0 }}>
                    คุณยังใช้สิทธิลดหย่อนไปแค่ {money(d.totalDeductions)} จากเพดานรวมที่ใช้ได้
                  </div>
                </div>
                <Button variant="link" size="none" to="/plan" style={{ color: 'var(--teal)', fontSize: 12.5 }}>
                  ดูสิทธิทั้งหมด →
                </Button>
              </div>
              <div className={s.adviceGrid}>
                <div className={s.advCard}>
                  <div className={s.advEyebrow}>SSF</div>
                  <div className={s.advTitle}>
                    {adv.ssf.suggest > 0 ? `ซื้อเพิ่มได้อีก ${money(adv.ssf.suggest)}` : adv.ssf.used >= adv.ssf.cap || d.retirementRoom === 0 ? 'ใช้เต็มสิทธิแล้ว' : adv.ssf.used === 0 ? 'ยังไม่ได้ใช้เลย' : `ใช้ไป ${money(adv.ssf.used)}`}
                  </div>
                  <ProgressBar value={adv.ssf.cap ? adv.ssf.used / adv.ssf.cap : 0} height={6} className={s.advBar} label="SSF ใช้ไปแล้ว" />
                  <div className={s.advSub}>
                    {adv.ssf.suggest > 0 ? (
                      <>
                        ประหยัดภาษี <strong>{money(adv.ssf.saved)}</strong> · ถือ 10 ปี
                      </>
                    ) : d.retirementRoom === 0 ? (
                      <>กองทุนเกษียณรวมถึงเพดาน {money(cfg.caps.retirementCombined)} แล้ว</>
                    ) : (
                      <>เพดาน {money(adv.ssf.cap)} · ถือ 10 ปี</>
                    )}
                  </div>
                </div>
                <div className={s.advCard}>
                  <div className={s.advEyebrow}>RMF</div>
                  <div className={s.advTitle}>{adv.rmf.used === 0 ? 'ยังไม่ได้ใช้เลย' : `ใช้ไป ${money(adv.rmf.used)}`}</div>
                  <ProgressBar value={adv.rmf.cap ? adv.rmf.used / adv.rmf.cap : 0} height={6} className={s.advBar} label="RMF ใช้ไปแล้ว" />
                  <div className={s.advSub}>เพดาน 30% ของรายได้ · ถือถึงอายุ 55</div>
                </div>
                {(() => {
                  const ratio = adv.life.cap ? adv.life.used / adv.life.cap : 0
                  const over = adv.life.entered > adv.life.cap
                  const warn = over || ratio >= 0.7
                  return (
                    <div className={s.advCard} data-tone={warn ? 'clay' : undefined}>
                      <div className={s.advEyebrow}>{warn ? 'ระวัง' : 'ประกันชีวิต'}</div>
                      <div className={s.advTitle}>{over ? 'ประกันชีวิตเกินเพดาน' : adv.life.room === 0 ? 'ประกันชีวิตเต็มสิทธิแล้ว' : ratio >= 0.7 ? 'ประกันชีวิตใกล้เต็ม' : `ยังซื้อเพิ่มได้อีก ${money(adv.life.room)}`}</div>
                      <ProgressBar value={ratio} height={6} className={s.advBar} color={warn ? 'var(--clay)' : undefined} track={warn ? 'var(--clay-track)' : undefined} label="ประกันชีวิตใช้ไปแล้ว" />
                      <div className={s.advSub}>
                        ใช้ {money(adv.life.used)} จากเพดาน {money(adv.life.cap)} (รวมประกันสุขภาพ)
                      </div>
                    </div>
                  )
                })()}
              </div>
            </section>
          </div>

          <aside className={s.rail}>
            <div className={s.kpi}>
              <div className={s.kpiLabel}>อัตราภาษีเฉลี่ยจริง</div>
              <div className={s.kpiFig}>
                <span className={s.kpiNum}>{(d.effectiveRate * 100).toFixed(1)}</span>
                <span className={s.kpiPct}>%</span>
              </div>
              <div className={s.kpiRows}>
                <div className={s.kpiRow}>
                  <span className={s.kpiRowLabel}>อัตราขั้นสูงสุด</span>
                  <span className={s.kpiRowFig}>{pctInt(d.marginalRate)}</span>
                </div>
                <div className={s.kpiRow}>
                  <span className={s.kpiRowLabel}>รายได้ต่อเดือน</span>
                  <span className={s.kpiRowFig}>{money(d.monthlyIncome)}</span>
                </div>
                <div className={s.kpiRow}>
                  <span className={s.kpiRowLabel}>ภาษีต่อเดือน</span>
                  <span className={s.kpiRowFig}>{money(d.monthlyTax)}</span>
                </div>
              </div>
            </div>

            {last && (
              <div className={s.cmp}>
                <div className={s.cmpTitle}>เทียบกับปีที่แล้ว</div>
                <div className={s.bars}>
                  <div className={s.barCol}>
                    <span className={s.barVal}>{money(last.tax)}</span>
                    <div className={s.bar} style={{ height: `${(last.tax / maxBar) * 80}px` }} />
                  </div>
                  <div className={s.barCol} data-current>
                    <span className={s.barVal}>{money(d.taxDue)}</span>
                    <div className={s.bar} style={{ height: `${(d.taxDue / maxBar) * 80}px` }} />
                  </div>
                </div>
                <div className={s.barLabels}>
                  <span>{last.taxYear}</span>
                  <span data-current>{ret.taxYear}</span>
                </div>
                <div className={s.cmpNote}>
                  {delta > 0 ? (
                    <>
                      เพิ่มขึ้น <strong>{money(delta)}</strong> จากปีก่อน
                    </>
                  ) : delta < 0 ? (
                    <>
                      ลดลง <strong>{money(-delta)}</strong> จากปีก่อน
                    </>
                  ) : (
                    'เท่ากับปีก่อน'
                  )}
                </div>
              </div>
            )}

            <div className={s.docs}>
              <div className={s.docsTitle}>เอกสารที่ต้องเตรียม</div>
              {docs.map((x) => (
                <div key={x.label} className={s.docRow} data-done={x.done}>
                  <CheckMark checked={x.done} />
                  {x.label}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function MobileResult() {
  const { derived: d, ret } = useTaxReturn()
  const abs = Math.abs(d.balance)
  return (
    <div className={s.m}>
      <div className={s.mTop}>
        <Button variant="link" size="none" className={s.mBack} to={`/calc/q/${TOTAL_QUESTIONS}`} aria-label="กลับไปแก้ไขข้อมูล">
          ←
        </Button>
        <Logo size="sm" onDark />
        <span className={s.mTopSpacer} aria-hidden="true" />
      </div>
      <main className={s.mBody}>
        <div className={s.mEyebrow}>ผลการคำนวณ {ret.taxYear}</div>
        <div className={s.mLabel}>ภาษีที่ต้องชำระทั้งปี</div>
        <div className={s.mFig}>{money(d.taxDue)}</div>
        <div className={s.mSub}>
          เฉลี่ยเดือนละ {money(d.monthlyTax)} บาท · {pct(d.effectiveRate)} ของรายได้
        </div>

        <div className={s.mPanel} data-tone={d.verdict}>
          <div className={s.mPanelTitle}>
            {d.verdict === 'refund' ? `ขอคืนได้ ${money(abs)} บาท` : d.verdict === 'owed' ? `ต้องชำระเพิ่ม ${money(abs)} บาท` : d.taxDue === 0 ? 'ปีนี้ไม่ต้องเสียภาษี' : 'หักไว้พอดี ไม่มียอดคืนหรือจ่ายเพิ่ม'}
          </div>
          <div className={s.mPanelSub}>
            {d.verdict === 'refund' ? `หัก ณ ที่จ่ายไว้เกินไป ${money(d.withholding)} → ${money(d.taxDue)}` : d.verdict === 'owed' ? `หัก ณ ที่จ่ายไว้ ${money(d.withholding)} น้อยกว่าภาษีจริง ${money(d.taxDue)}` : `หัก ณ ที่จ่ายไว้ ${money(d.withholding)}`}
          </div>
        </div>

        <div className={s.mEyebrow} style={{ marginBottom: 14 }}>
          ที่มาของตัวเลข
        </div>
        <div className={s.mRows}>
          <div className={s.mRow}>
            <span className={s.mRowLabel}>เงินได้รวม</span>
            <span className={s.mRowFig}>{money(d.grossIncome)}</span>
          </div>
          <div className={s.mRow}>
            <span className={s.mRowLabel}>ค่าใช้จ่าย</span>
            <span className={s.mRowFig} data-muted>
              −{money(d.expenseDeduction)}
            </span>
          </div>
          <div className={s.mRow}>
            <span className={s.mRowLabel}>ค่าลดหย่อน</span>
            <span className={s.mRowFig} data-muted>
              −{money(d.totalDeductions)}
            </span>
          </div>
          <div className={s.mRow} data-total>
            <span className={s.mRowLabel}>เงินได้สุทธิ</span>
            <span className={s.mRowFig}>{money(d.netIncome)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 9 }}>
          <BracketBar rows={d.taxByBracket} height={38} radius={8} dark minSegments={1} />
        </div>
        <BracketRateRow rows={d.taxByBracket} />
      </main>
      <div className={s.mFoot}>
        <Button variant="onDarkWhite" size="xl" block to="/plan">
          ดูวิธีลดภาษีปีหน้า
        </Button>
        <Button variant="link" size="none" className={s.mEdit} to={`/calc/q/${TOTAL_QUESTIONS}`}>
          ← กลับไปแก้ไขข้อมูล
        </Button>
      </div>
      <PhoneTabBar active="คำนวณ" />
    </div>
  )
}

export function Result() {
  const mobile = useIsMobile()
  return mobile ? <MobileResult /> : <DesktopResult />
}
