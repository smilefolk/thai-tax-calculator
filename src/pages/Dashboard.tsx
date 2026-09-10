import { Link } from 'react-router-dom'
import { DarkSidebar } from '../components/layout/DarkSidebar'
import { PhoneTabBar } from '../components/layout/PhoneTabBar'
import { Avatar, Pill, ProgressBar } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { priorYears, user, type FilingRecord } from '../data/history'
import { useIsMobile } from '../hooks/useMediaQuery'
import { daysUntil, greeting, thaiDate } from '../lib/dates'
import { money, signed } from '../lib/format'
import { availableTaxYears } from '../lib/tax/config'
import { buildPlans } from '../lib/tax/plans'
import { useTaxReturn } from '../store/taxReturn'
import s from './Dashboard.module.css'

function useDashboard() {
  const { derived: d, ret, cfg } = useTaxReturn()
  const current: FilingRecord = { taxYear: ret.taxYear, form: ret.income.every((e) => e.category === '40(1)') ? 'ภ.ง.ด. 91' : 'ภ.ง.ด. 90', tax: d.taxDue, balance: d.balance, status: 'draft' }
  const history = [current, ...priorYears.filter((p) => p.taxYear !== ret.taxYear)].sort((a, b) => b.taxYear - a.taxYear)
  const fiveYears = history.slice(0, 5).reverse()
  const maxTax = Math.max(...fiveYears.map((h) => h.tax), 1)
  const last = priorYears.find((p) => p.taxYear === ret.taxYear - 1)
  const delta = last ? d.taxDue - last.tax : 0
  const days = daysUntil(cfg.filingDeadline)
  const usedRatio = d.totalAllowanceCeiling > 0 ? 1 - d.totalUnusedAllowance / d.totalAllowanceCeiling : 0
  const maxPlan = buildPlans(d, cfg)[2]
  const ssfMissing = ret.deductions.ssf > 0 && !ret.attachments.some((a) => a.kind === 'ssf' && a.status === 'verified')
  const buyDays = daysUntil(`${ret.taxYear - 543}-12-31`)
  return { d, ret, cfg, history, fiveYears, maxTax, delta, days, usedRatio, maxPlan, ssfMissing, buyDays }
}

const STATUS = {
  draft: { label: 'ร่าง', bg: 'var(--clay-tint)', color: 'var(--clay-deep)' },
  refunded: { label: 'คืนแล้ว', bg: 'var(--green-tint)', color: 'var(--green-deeper)' },
  paid: { label: 'ชำระแล้ว', bg: 'var(--green-tint)', color: 'var(--green-deeper)' },
}

function DesktopDashboard() {
  const { d, ret, cfg, history, fiveYears, maxTax, delta, days, usedRatio, maxPlan, ssfMissing, buyDays } = useDashboard()
  const { dispatch } = useTaxReturn()
  const readiness = Math.round((ret.attachments.filter((a) => a.status === 'verified').length / Math.max(1, ret.attachments.length + (ssfMissing ? 1 : 0))) * 100)
  return (
    <div className={s.wrap}>
      <DarkSidebar />
      <main className={s.main}>
        <div className={s.head}>
          <div>
            <h1 className={s.h1}>
              {greeting()} คุณ{user.firstName}
            </h1>
            <div className={s.sub}>
              ยื่นแบบปีภาษี {ret.taxYear} ได้ตั้งแต่ {thaiDate(cfg.filingOpens)} — คุณเตรียมข้อมูลไว้ครบ {readiness}% แล้ว
            </div>
          </div>
          <div className={s.headBtns}>
            <span className={s.yearWrap}>
              <select className={s.yearSel} aria-label="ปีภาษี" value={ret.taxYear} onChange={(e) => dispatch({ type: 'setTaxYear', year: Number(e.target.value) })}>
                {availableTaxYears().map((y) => (
                  <option key={y} value={y}>
                    ปีภาษี {y}
                  </option>
                ))}
              </select>
            </span>
            <Button variant="primary" size="md" style={{ fontSize: 12.5 }} to="/calc/income">
              + คำนวณใหม่
            </Button>
          </div>
        </div>

        <div className={s.kpis}>
          <div className={s.kpi}>
            <div className={s.kpiLabel}>ภาษีบุคคลธรรมดา</div>
            <div className={s.kpiFig}>{money(d.taxDue)}</div>
            <div className={s.kpiMeta} data-mono style={{ color: delta > 0 ? 'var(--clay-mid)' : delta < 0 ? 'var(--green-deep)' : undefined }}>
              {delta > 0 ? `↑ ${money(delta)} จากปีก่อน` : delta < 0 ? `↓ ${money(-delta)} จากปีก่อน` : 'เท่ากับปีก่อน'}
            </div>
          </div>
          <div className={s.kpi}>
            <div className={s.kpiLabel}>{d.verdict === 'owed' ? 'ต้องชำระเพิ่ม' : 'ขอคืนได้'}</div>
            <div className={s.kpiFig} style={{ color: d.verdict === 'owed' ? 'var(--clay-mid)' : 'var(--green-deep)' }}>
              {money(Math.abs(d.balance))}
            </div>
            <div className={s.kpiMeta}>ยังไม่ได้ยื่น</div>
          </div>
          <div className={s.kpi}>
            <div className={s.kpiLabel}>สิทธิลดหย่อนคงเหลือ</div>
            <div className={s.kpiFig}>{money(d.totalUnusedAllowance)}</div>
            <ProgressBar value={usedRatio} height={5} label="สัดส่วนสิทธิที่ใช้แล้ว" className="" />
          </div>
          <div className={s.kpi} data-dark>
            <div className={s.kpiLabel}>เหลือเวลายื่น</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className={s.kpiFig}>{Math.max(0, days)}</span>
              <span style={{ font: '400 13px var(--sans)', color: 'rgba(255,255,255,.6)' }}>วัน</span>
            </div>
            <div className={s.kpiMeta}>{days < 0 ? `ปิดรับแล้วเมื่อ ${thaiDate(cfg.filingDeadline)}` : `ปิดรับ ${thaiDate(cfg.filingDeadline)}`}</div>
          </div>
        </div>

        <div className={s.body}>
          <div className={s.col}>
            <section className={s.card} aria-labelledby="hist-h">
              <div className={s.cardHead}>
                <h2 id="hist-h" className={s.cardTitle}>
                  ภาษีที่จ่ายจริง 5 ปีย้อนหลัง
                </h2>
                <span className={s.cardMeta}>รวมทุกโมดูล</span>
              </div>
              <div className={s.bars} role="img" aria-label={fiveYears.map((h) => `${h.taxYear}: ${money(h.tax)}`).join(', ')}>
                {fiveYears.map((h) => (
                  <div key={h.taxYear} className={s.barCol} data-current={h.taxYear === ret.taxYear} data-prev={h.taxYear === ret.taxYear - 1}>
                    <span className={s.barVal}>{money(h.tax)}</span>
                    <div className={s.bar} style={{ height: `${(h.tax / maxTax) * 101}px` }} />
                  </div>
                ))}
              </div>
              <div className={s.barAxis}>
                {fiveYears.map((h) => (
                  <span key={h.taxYear} data-current={h.taxYear === ret.taxYear}>
                    {h.taxYear}
                  </span>
                ))}
              </div>
            </section>

            <section className={s.card} style={{ paddingBottom: 12 }} aria-labelledby="filing-h">
              <h2 id="filing-h" className={s.cardTitle} style={{ marginBottom: 16 }}>
                ประวัติการยื่นแบบ
              </h2>
              <div className={s.thead} role="row">
                <span>ปีภาษี</span>
                <span>แบบ</span>
                <span style={{ textAlign: 'right' }}>ภาษี</span>
                <span style={{ textAlign: 'right' }}>คืน/จ่ายเพิ่ม</span>
                <span style={{ textAlign: 'right' }}>สถานะ</span>
              </div>
              {history.slice(0, 3).map((h) => (
                <div key={h.taxYear} className={s.tr} role="row">
                  <span className={s.tYear}>{h.taxYear}</span>
                  <span className={s.tForm}>{h.form}</span>
                  <span className={s.tNum}>{money(h.tax)}</span>
                  <span className={s.tNum} style={{ color: h.balance > 0 ? 'var(--green-deep)' : 'var(--ink-muted)' }}>
                    {signed(h.balance, { plus: true })}
                  </span>
                  <span className={s.tStatus}>
                    <Pill bg={STATUS[h.status].bg} color={STATUS[h.status].color}>
                      {STATUS[h.status].label}
                    </Pill>
                  </span>
                </div>
              ))}
              <div className={s.more}>ดูทั้งหมด {history.length} ปี →</div>
            </section>
          </div>

          <div className={s.col}>
            <section className={s.tasks} aria-labelledby="tasks-h">
              <h2 id="tasks-h" className={s.tasksTitle}>
                สิ่งที่ต้องทำต่อ
              </h2>
              {ssfMissing && (
                <Link to="/file" className={s.task}>
                  <span className={s.taskRule} style={{ background: 'var(--clay)' }} />
                  <span>
                    <span className={s.taskTitle} style={{ display: 'block' }}>
                      อัปโหลดหนังสือรับรอง SSF
                    </span>
                    <span className={s.taskSub}>ยังขาด 1 ฉบับจาก บลจ.</span>
                  </span>
                </Link>
              )}
              <Link to="/plan" className={s.task}>
                <span className={s.taskRule} style={{ background: 'var(--teal)' }} />
                <span>
                  <span className={s.taskTitle} style={{ display: 'block' }}>
                    ตัดสินใจแผนลดหย่อนก่อนสิ้นปี
                  </span>
                  <span className={s.taskSub}>{buyDays > 0 ? `เหลือ ${buyDays} วันในการซื้อกองทุน` : 'หมดเขตซื้อกองทุนปีนี้แล้ว — วางแผนปีหน้าได้เลย'}</span>
                </span>
              </Link>
              <Link to="/file" className={s.task}>
                <span className={s.taskRule} style={{ background: 'var(--line-strong)' }} />
                <span>
                  <span className={s.taskTitle} style={{ display: 'block' }}>
                    ยืนยันเลขบัญชีรับเงินคืน
                  </span>
                  <span className={s.taskSub}>พร้อมเพย์ {user.promptPay}</span>
                </span>
              </Link>
            </section>

            {maxPlan.saved > 0 && (
              <section className={s.upsell}>
                <div className={s.upsellTitle}>คุณจ่ายภาษีมากกว่าที่จำเป็น</div>
                <div className={s.upsellSub}>
                  ใช้สิทธิลดหย่อนเพียง {Math.round(usedRatio * 100)}% ถ้าวางแผนเต็มที่ประหยัดได้ถึง <strong>{money(maxPlan.saved)}</strong> บาทต่อปี
                </div>
                <Button variant="primary" size="md" style={{ background: 'var(--teal-hover)' }} to="/plan">
                  เปิดตัววางแผน
                </Button>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function MobileDashboard() {
  const { d, ret, fiveYears, maxTax, days, usedRatio, maxPlan, ssfMissing } = useDashboard()
  return (
    <div className={s.m}>
      <main className={s.mBody}>
        <div className={s.mHead}>
          <div>
            <div className={s.mH1}>ภาพรวมของคุณ</div>
            <div className={s.mSub}>ปีภาษี {ret.taxYear}</div>
          </div>
          <Avatar size={32} />
        </div>
        <div className={s.mHero}>
          <div className={s.mHeroLabel}>ภาษีรวมทุกโมดูล</div>
          <div className={s.mHeroFig}>{money(d.taxDue)}</div>
          <div className={s.mHeroRow}>
            <div>
              <div className={s.mHeroK}>{d.verdict === 'owed' ? 'ชำระเพิ่ม' : 'ขอคืน'}</div>
              <div className={s.mHeroV} style={{ color: d.verdict === 'owed' ? 'var(--clay-on-dark)' : 'var(--green-on-dark)' }}>
                {money(Math.abs(d.balance))}
              </div>
            </div>
            <div>
              <div className={s.mHeroK}>เหลือเวลายื่น</div>
              <div className={s.mHeroV}>{Math.max(0, days)} วัน</div>
            </div>
          </div>
        </div>
        {maxPlan.saved > 0 && (
          <Link to="/plan" className={s.mNudge}>
            <div className={s.mNudgeTitle}>ยังประหยัดได้อีก {money(maxPlan.saved)}</div>
            <div className={s.mNudgeSub}>ใช้สิทธิลดหย่อนไปแค่ {Math.round(usedRatio * 100)}% ของเพดาน</div>
          </Link>
        )}
        <div className="eyebrow eyebrow--sm" style={{ marginBottom: 11 }}>
          5 ปีย้อนหลัง
        </div>
        <div className={s.mBars} role="img" aria-label={fiveYears.map((h) => `${h.taxYear}: ${money(h.tax)}`).join(', ')}>
          {fiveYears.map((h) => (
            <div key={h.taxYear} className={s.mBar} style={{ height: `${(h.tax / maxTax) * 100}%` }} data-current={h.taxYear === ret.taxYear} data-prev={h.taxYear === ret.taxYear - 1} />
          ))}
        </div>
        <div className={s.mAxis}>
          {fiveYears.map((h) => (
            <span key={h.taxYear} data-current={h.taxYear === ret.taxYear}>
              {String(h.taxYear).slice(2)}
            </span>
          ))}
        </div>
        {ssfMissing ? (
          <Link to="/file" className={s.mTask}>
            <span className={s.mTaskRule} style={{ background: 'var(--clay)' }} />
            <span style={{ flex: 1 }}>
              <span className={s.mTaskTitle} style={{ display: 'block' }}>
                อัปโหลดหนังสือรับรอง SSF
              </span>
              <span className={s.mTaskSub}>ยังขาด 1 ฉบับ</span>
            </span>
            <span style={{ font: '400 18px/1 var(--sans)', color: 'var(--ink-ghost)' }} aria-hidden="true">
              ›
            </span>
          </Link>
        ) : (
          <Link to="/file" className={s.mTask}>
            <span className={s.mTaskRule} style={{ background: 'var(--teal)' }} />
            <span style={{ flex: 1 }}>
              <span className={s.mTaskTitle} style={{ display: 'block' }}>
                เอกสารครบแล้ว พร้อมยื่นแบบ
              </span>
              <span className={s.mTaskSub}>ตรวจสอบและยื่นได้เลย</span>
            </span>
            <span style={{ font: '400 18px/1 var(--sans)', color: 'var(--ink-ghost)' }} aria-hidden="true">
              ›
            </span>
          </Link>
        )}
      </main>
      <PhoneTabBar active="ภาพรวม" />
    </div>
  )
}

export function Dashboard() {
  const mobile = useIsMobile()
  return mobile ? <MobileDashboard /> : <DesktopDashboard />
}
