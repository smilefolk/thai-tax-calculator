import { useEffect, useRef, useState } from 'react'
import { DarkSidebar } from '../components/layout/DarkSidebar'
import { LedgerRow, ProgressBar } from '../components/ui/Bits'
import { Button } from '../components/ui/Button'
import { user } from '../data/history'
import { abbrev, money, pctInt, signed } from '../lib/format'
import { BONUS_ID, SALARY_ID } from '../lib/tax/defaults'
import type { DeductionKey } from '../lib/tax/types'
import { useTaxReturn } from '../store/taxReturn'
import s from './Ledger.module.css'
import { LABELS } from './wizard/SummaryStep'

const LEFT: DeductionKey[] = ['personal', 'spouse', 'children', 'socialSecurity']
const RIGHT: DeductionKey[] = ['lifeInsurance', 'ssf', 'rmf', 'homeLoanInterest']
const EXTRA: DeductionKey[] = ['parents', 'disabled', 'healthInsurance', 'parentHealthInsurance', 'pvd', 'nsf', 'stimulusSchemes', 'donations', 'doubleDonations']

export function Ledger() {
  const { ret, derived: d, dispatch, cfg, clearAll } = useTaxReturn()
  const [active, setActive] = useState<'a' | 'b' | 'c' | 'd'>('a')
  const secRefs = { a: useRef<HTMLDivElement>(null), b: useRef<HTMLDivElement>(null), c: useRef<HTMLDivElement>(null), d: useRef<HTMLDivElement>(null) }

  useEffect(() => {
    dispatch({ type: 'setViewMode', mode: 'ledger' })
    return () => dispatch({ type: 'setViewMode', mode: 'wizard' })
  }, [dispatch])

  const salary = ret.income.find((e) => e.id === SALARY_ID)!
  const bonus = ret.income.find((e) => e.id === BONUS_ID)!
  const others = ret.income.filter((e) => e.id !== SALARY_ID && e.id !== BONUS_ID)
  const onlySalary = ret.income.every((e) => e.category === '40(1)')
  const form = onlySalary ? 'ภ.ง.ด. 91' : 'ภ.ง.ด. 90'

  const item = (k: DeductionKey) => d.deductionItems.find((i) => i.key === k)!
  const setD = (k: DeductionKey) => (n: number) => dispatch({ type: 'setDeduction', key: k, value: n })
  const isProfileKey = (k: DeductionKey) => ['personal', 'spouse', 'children', 'parents', 'disabled'].includes(k)

  // completion: fields with a value / fields that could have one
  const fields = [salary.amount, bonus.amount, ret.withholding.amount, ...d.deductionItems.filter((i) => !isProfileKey(i.key)).map((i) => i.entered)]
  const filled = fields.filter((v) => v > 0).length + 5
  const totalFields = fields.length + 5
  const extraShown = EXTRA.filter((k) => item(k).entered > 0)

  const jump = (k: 'a' | 'b' | 'c' | 'd') => {
    setActive(k)
    secRefs[k].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className={s.wrap}>
      <DarkSidebar>
        <div className={s.sideInner}>
          <div className={s.sideEyebrow}>
            แบบ {form} / {ret.taxYear}
          </div>
          <nav className={s.sideNav} aria-label="หมวดของแบบ">
            {(
              [
                ['a', 'ก. รายได้', d.grossIncome],
                ['b', 'ข. ค่าใช้จ่าย', d.expenseDeduction],
                ['c', 'ค. ค่าลดหย่อน', d.totalDeductions],
                ['d', 'ง. ภาษีหัก ณ ที่จ่าย', d.withholding],
              ] as const
            ).map(([k, label, fig]) => (
              <button key={k} type="button" className={s.sideRow} aria-current={active === k} onClick={() => jump(k)}>
                <span>{label}</span>
                <span className={s.sideFig}>{abbrev(fig)}</span>
              </button>
            ))}
          </nav>
          <div className={s.sideDiv} />
          <div className={s.sideNote}>
            กรอกครบ {filled} จาก {totalFields} ช่อง
          </div>
          <ProgressBar value={filled / totalFields} height={5} color="var(--teal-on-dark)" track="var(--on-dark-div)" className="" label="ความครบถ้วน" />
          <div className={s.sidePrivacy}>
            ข้อมูลทั้งหมดคำนวณในเครื่องคุณ
            <br />
            ไม่ถูกส่งออกไปที่ไหน
          </div>
        </div>
      </DarkSidebar>

      <main className={s.sheet}>
        <div className={s.docHead}>
          <div>
            <h1 className={s.h1}>แบบแสดงรายการภาษี</h1>
            <div className={s.docSub}>
              {user.title} · เลขประจำตัวผู้เสียภาษี <span className="num">{user.taxIdMasked}</span>
            </div>
          </div>
          <div className={s.docBtns}>
            <Button variant="secondary" size="sm" style={{ padding: '9px 15px' }} to="/calc/income">
              กลับไปโหมดทีละขั้น
            </Button>
            <Button variant="secondary" size="sm" style={{ padding: '9px 15px' }} onClick={() => alert('การนำเข้าไฟล์ 50 ทวิ จะเปิดใช้ในเวอร์ชันถัดไป')}>
              นำเข้าไฟล์ 50 ทวิ
            </Button>
            <Button
              variant="secondary"
              size="sm"
              style={{ padding: '9px 15px' }}
              onClick={() => {
                if (confirm('ล้างข้อมูลทั้งหมดในแบบนี้?')) clearAll()
              }}
            >
              ล้างทั้งหมด
            </Button>
          </div>
        </div>

        <div ref={secRefs.a} className={['eyebrow eyebrow--teal', s.section].join(' ')} style={{ letterSpacing: '.12em', textTransform: 'none', scrollMarginTop: 16 }}>
          ก · เงินได้พึงประเมิน
        </div>
        <LedgerRow label="เงินเดือน ค่าจ้าง 40(1)" value={salary.amount} editable onChange={(n) => dispatch({ type: 'setIncome', id: SALARY_ID, amount: n })} />
        <LedgerRow label="โบนัส" value={bonus.amount} editable onChange={(n) => dispatch({ type: 'setIncome', id: BONUS_ID, amount: n })} />
        {others.length === 0 ? (
          <LedgerRow label="รับจ้างอิสระ 40(2)" value={0} muted />
        ) : (
          others.map((e) => <LedgerRow key={e.id} label={`เงินได้ ${e.category}`} value={e.amount} editable onChange={(n) => dispatch({ type: 'setIncome', id: e.id, amount: n })} />)
        )}
        <LedgerRow label="รวมเงินได้" value={d.grossIncome} total />

        <div ref={secRefs.b} className={['eyebrow eyebrow--teal', s.section].join(' ')} style={{ letterSpacing: '.12em', textTransform: 'none', paddingTop: 26, scrollMarginTop: 16 }}>
          ข · หักค่าใช้จ่าย
        </div>
        <LedgerRow
          label={
            <>
              {salary.expenseMethod === 'standard' ? `เหมาจ่าย ${pctInt(0.5)}` : 'ตามจริง'}{' '}
              <span style={{ color: 'var(--ink-faint)', fontSize: 12.5 }}>(เพดาน {money(cfg.expenseRules['40(1)'].type === 'standard' ? (cfg.expenseRules['40(1)'].cap ?? 0) : 0)})</span>
            </>
          }
          value={d.expenseDeduction}
          total
          negative
        />

        <div ref={secRefs.c} className={['eyebrow eyebrow--teal', s.section].join(' ')} style={{ letterSpacing: '.12em', textTransform: 'none', paddingTop: 26, scrollMarginTop: 16 }}>
          ค · หักค่าลดหย่อน
        </div>
        <div className={s.section2}>
          <div>
            {LEFT.map((k) => (
              <LedgerRow key={k} label={k === 'children' ? `บุตร × ${ret.filerProfile.childrenCount}` : LABELS[k]} value={item(k).allowed} compact editable={!isProfileKey(k)} onChange={setD(k)} muted={item(k).allowed === 0} />
            ))}
          </div>
          <div>
            {RIGHT.map((k) => (
              <LedgerRow key={k} label={LABELS[k]} value={ret.deductions[k]} compact editable onChange={setD(k)} muted={ret.deductions[k] === 0} />
            ))}
          </div>
          {extraShown.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              {extraShown.map((k) => (
                <LedgerRow key={k} label={LABELS[k]} value={ret.deductions[k]} compact editable onChange={setD(k)} />
              ))}
            </div>
          )}
        </div>
        <LedgerRow label="รวมค่าลดหย่อน" value={d.totalDeductions} total topRule negative />

        <div className={s.grand}>
          <span className={s.grandLabel}>เงินได้สุทธิ</span>
          <span className={s.grandFig}>{money(d.netIncome)}</span>
        </div>

        <div ref={secRefs.d} className={['eyebrow eyebrow--teal', s.section].join(' ')} style={{ letterSpacing: '.12em', textTransform: 'none', paddingTop: 0, scrollMarginTop: 16 }}>
          ง · ภาษีหัก ณ ที่จ่าย
        </div>
        <LedgerRow label="ภาษีที่ถูกหักไว้แล้ว (50 ทวิ)" value={ret.withholding.amount} editable onChange={(n) => dispatch({ type: 'setWithholding', amount: n })} />
        <div style={{ height: 34 }} />
      </main>

      <div className={s.bottom}>
        <div className={s.figs}>
          <div>
            <div className={s.figLabel}>ภาษีที่คำนวณได้</div>
            <div className={s.fig}>{money(d.taxDue)}</div>
          </div>
          <div>
            <div className={s.figLabel}>หัก ณ ที่จ่ายแล้ว</div>
            <div className={s.fig} style={{ color: 'rgba(255,255,255,.7)' }}>
              {money(d.withholding)}
            </div>
          </div>
          <div>
            <div className={s.figLabel}>{d.verdict === 'owed' ? 'ต้องชำระเพิ่ม' : 'ขอคืนได้'}</div>
            <div className={s.fig} style={{ color: d.verdict === 'owed' ? 'var(--clay-on-dark)' : 'var(--green-on-dark)' }}>
              {d.verdict === 'owed' ? signed(d.balance) : signed(d.balance, { plus: true })}
            </div>
          </div>
        </div>
        <div className={s.bottomBtns}>
          <Button variant="onDarkOutline" size="md" to="/file">
            ดาวน์โหลด PDF
          </Button>
          <Button variant="onDarkWhite" size="md" style={{ padding: '12px 26px', fontSize: 13.5 }} to="/result">
            ดูรายละเอียดการคำนวณ
          </Button>
        </div>
      </div>
    </div>
  )
}
