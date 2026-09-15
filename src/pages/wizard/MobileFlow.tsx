import type { ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ProgressBar } from '../../components/ui/Bits'
import { Button } from '../../components/ui/Button'
import { MoneyInput } from '../../components/ui/MoneyInput'
import { RadioCard } from '../../components/ui/RadioCard'
import { Segmented } from '../../components/ui/Segmented'
import { useIsMobile } from '../../hooks/useMediaQuery'
import { money } from '../../lib/format'
import { maxParents } from '../../lib/tax/calc'
import { BONUS_ID, SALARY_ID } from '../../lib/tax/defaults'
import type { DeductionKey } from '../../lib/tax/types'
import { useTaxReturn } from '../../store/taxReturn'
import s from './MobileFlow.module.css'
import { questions, TOTAL_QUESTIONS, type Question } from './questions'

interface MoneyModel {
  value: number
  cap: number
  set: (n: number) => void
  skip: () => void
  label: string
  /** deduction key backing this question, when it is one */
  key?: DeductionKey
}

function useMoneyModel(q: Question): MoneyModel {
  const { ret, derived, dispatch } = useTaxReturn()
  const k = q.q
  switch (k.kind) {
    case 'salary': {
      const entry = ret.income.find((e) => e.id === SALARY_ID)!
      const monthly = entry.enteredAs === 'monthly'
      return {
        value: monthly ? entry.amount / 12 : entry.amount,
        cap: Infinity,
        set: (n: number) => dispatch(monthly ? { type: 'setIncomeMonthly', id: SALARY_ID, monthly: n } : { type: 'setIncome', id: SALARY_ID, amount: n }),
        skip: () => dispatch({ type: 'setIncome', id: SALARY_ID, amount: 0 }),
        label: monthly ? 'เงินเดือนต่อเดือน' : 'เงินเดือน ค่าจ้าง รวมทั้งปี',
      }
    }
    case 'money-income': {
      const entry = ret.income.find((e) => e.id === BONUS_ID)!
      return {
        value: entry.amount,
        cap: Infinity,
        set: (n: number) => dispatch({ type: 'setIncome', id: BONUS_ID, amount: n }),
        skip: () => dispatch({ type: 'setIncome', id: BONUS_ID, amount: 0 }),
        label: 'จำนวนเงิน',
      }
    }
    case 'deduction': {
      const it = derived.deductionItems.find((i) => i.key === k.key)!
      return {
        value: ret.deductions[k.key],
        cap: it.cap,
        set: (n: number) => dispatch({ type: 'setDeduction', key: k.key, value: n }),
        skip: () => dispatch({ type: 'skipDeduction', key: k.key }),
        label: 'จำนวนเงิน',
        key: k.key,
      }
    }
    case 'withholding':
      return {
        value: ret.withholding.amount,
        cap: Infinity,
        set: (n: number) => dispatch({ type: 'setWithholding', amount: n }),
        skip: () => dispatch({ type: 'setWithholding', amount: 0 }),
        label: 'ภาษีที่ถูกหักไว้',
      }
    default:
      return { value: 0, cap: Infinity, set: () => {}, skip: () => {}, label: '' }
  }
}

function SalaryModeToggle() {
  const { ret, dispatch } = useTaxReturn()
  const entry = ret.income.find((e) => e.id === SALARY_ID)!
  return (
    <div className={s.modeToggle}>
      <Segmented
        size="lg"
        ariaLabel="วิธีกรอกเงินเดือน"
        value={entry.enteredAs ?? 'annual'}
        onChange={(mode) => dispatch({ type: 'setIncomeMode', id: SALARY_ID, mode })}
        options={[
          { value: 'monthly', label: 'ต่อเดือน × 12' },
          { value: 'annual', label: 'ยอดรวมทั้งปี' },
        ]}
      />
    </div>
  )
}

function MoneyQuestion({ q }: { q: Question }) {
  const m = useMoneyModel(q)
  const { ret, skipped } = useTaxReturn()
  const finiteCap = Number.isFinite(m.cap) && m.cap > 0
  const isSalary = q.q.kind === 'salary'
  const salaryMonthly = isSalary && ret.income.find((e) => e.id === SALARY_ID)!.enteredAs === 'monthly'
  const wasSkipped = m.key ? skipped.includes(m.key) : false
  return (
    <>
      {isSalary && <SalaryModeToggle />}
      <div className={s.amount}>
        <MoneyInput big label={m.label} value={m.value} onChange={m.set} autoFocus suffix="บาท" />
      </div>
      {isSalary && (
        <div className={s.subHint} aria-live="polite">
          {salaryMonthly ? (
            <>
              <span className="num">× 12 เดือน = {money(m.value * 12)}</span> · รายได้แต่ละเดือนไม่เท่ากัน? เลือก "ยอดรวมทั้งปี"
            </>
          ) : (
            'ยอดรวมทุกเดือนตามหนังสือรับรอง 50 ทวิ ไม่รวมโบนัส'
          )}
        </div>
      )}
      <div className={s.chips} role="group" aria-label="เติมเร็ว">
        <button type="button" className={s.chip} onClick={() => m.set(m.value + 10_000)}>
          +10,000
        </button>
        <button type="button" className={s.chip} onClick={() => m.set(m.value + 50_000)}>
          +50,000
        </button>
        {finiteCap ? (
          <button type="button" className={s.chip} onClick={() => m.set(m.cap)}>
            เต็มสิทธิ
          </button>
        ) : (
          <button type="button" className={s.chip} onClick={() => m.set(0)}>
            ล้าง
          </button>
        )}
      </div>
      {wasSkipped && m.value === 0 && (
        <div className={s.skipped} role="status">
          ข้ามไว้ — ไม่ได้นับรายการนี้ กรอกได้ทุกเมื่อถ้ามี
        </div>
      )}
      {q.info && (
        <div className={s.info}>
          <span className={s.infoIcon} aria-hidden="true">
            i
          </span>
          <div className={s.infoText}>
            {q.info}
            {finiteCap && (
              <>
                {' '}
                — สิทธิของคุณคือ <strong>{money(m.cap)}</strong>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function SpouseQuestion() {
  const { ret, dispatch, cfg } = useTaxReturn()
  const p = ret.filerProfile
  const set = (patch: Partial<typeof p>) => dispatch({ type: 'setProfile', profile: patch })
  return (
    <div className={s.radios} role="radiogroup" aria-label="สถานะสมรส">
      <RadioCard name="m-marital" layout="row" selected={!p.hasSpouse} onSelect={() => set({ hasSpouse: false, spouseHasIncome: false })} title="โสด / หย่า / หม้าย" sub="ยื่นแบบคนเดียว" />
      <RadioCard name="m-marital" layout="row" selected={p.hasSpouse && !p.spouseHasIncome} onSelect={() => set({ hasSpouse: true, spouseHasIncome: false })} title="สมรส · คู่สมรสไม่มีเงินได้" sub={`ลดหย่อนเพิ่ม ${money(cfg.caps.spouse)} บาท`} />
      <RadioCard name="m-marital" layout="row" selected={p.hasSpouse && p.spouseHasIncome} onSelect={() => set({ hasSpouse: true, spouseHasIncome: true })} title="สมรส · คู่สมรสมีเงินได้" sub="แยกยื่นหรือรวมยื่นได้" />
    </div>
  )
}

function CountRow({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (n: number) => void }) {
  const set = (v: number) => onChange(Math.max(0, Math.min(max, v)))
  return (
    <div className={s.counterBox} role="group" aria-label={label}>
      <div>
        <div style={{ font: '400 12px var(--sans)', color: 'var(--ink-faint)', marginBottom: 6 }}>{label}</div>
        <div className={s.counterVal} aria-live="polite">
          {value} <span style={{ font: '400 16px var(--sans)', color: 'var(--ink-faint)' }}>คน</span>
        </div>
      </div>
      <div className={s.counterBtns}>
        <button type="button" className={s.counterBtn} onClick={() => set(value - 1)} aria-label={`ลด${label}`}>
          −
        </button>
        <button type="button" className={s.counterBtn} onClick={() => set(value + 1)} aria-label={`เพิ่ม${label}`}>
          +
        </button>
      </div>
    </div>
  )
}

function InfoBlock({ children }: { children: ReactNode }) {
  return (
    <div className={s.info}>
      <span className={s.infoIcon} aria-hidden="true">
        i
      </span>
      <div className={s.infoText}>{children}</div>
    </div>
  )
}

function ChildrenQuestion() {
  const { ret, derived, dispatch, cfg } = useTaxReturn()
  const p = ret.filerProfile
  const allowed = derived.deductionItems.find((i) => i.key === 'children')?.allowed ?? 0
  return (
    <>
      <CountRow label="จำนวนบุตร" value={p.childrenCount} max={10} onChange={(n) => dispatch({ type: 'setProfile', profile: { childrenCount: n } })} />
      {p.childrenCount > 0 && (
        <div style={{ marginTop: 10 }}>
          <CountRow
            label="ในจำนวนนี้ เกิดปี 2561 เป็นต้นไป"
            value={p.childrenBornFrom2561}
            max={p.childrenCount}
            onChange={(n) => dispatch({ type: 'setProfile', profile: { childrenBornFrom2561: n } })}
          />
        </div>
      )}
      <InfoBlock>
        ลดหย่อนบุตรได้คนละ {money(cfg.caps.childEach)} บาท คนที่ 2 เป็นต้นไปที่เกิดปี 2561+ ได้ {money(cfg.caps.childEachFrom2561)} — ตอนนี้ได้ <strong>{money(allowed)}</strong>
      </InfoBlock>
    </>
  )
}

function ParentsQuestion() {
  const { ret, derived, dispatch, cfg } = useTaxReturn()
  const p = ret.filerProfile
  const max = maxParents(p)
  const allowed = derived.deductionItems.find((i) => i.key === 'parents')?.allowed ?? 0
  return (
    <>
      <CountRow label="บิดามารดาที่อุปการะ" value={Math.min(p.parentsSupported, max)} max={max} onChange={(n) => dispatch({ type: 'setProfile', profile: { parentsSupported: n } })} />
      <InfoBlock>
        {max === 4 ? 'นับบิดามารดาของตัวเองและของคู่สมรสได้รวม 4 คน' : 'นับได้เฉพาะบิดามารดาของตัวเอง 2 คน (ของคู่สมรสจะใช้สิทธิในแบบของคู่สมรสเอง)'} · คนละ {money(cfg.caps.parentEach)} — ตอนนี้ได้{' '}
        <strong>{money(allowed)}</strong>
      </InfoBlock>
    </>
  )
}

function DisabledQuestion() {
  const { ret, derived, dispatch, cfg } = useTaxReturn()
  const p = ret.filerProfile
  const allowed = derived.deductionItems.find((i) => i.key === 'disabled')?.allowed ?? 0
  return (
    <>
      <CountRow label="ผู้พิการ / ทุพพลภาพที่อุปการะ" value={p.disabledDependents} max={4} onChange={(n) => dispatch({ type: 'setProfile', profile: { disabledDependents: n } })} />
      <InfoBlock>
        คนละ {money(cfg.caps.disabledEach)} บาท ต้องมีชื่อเป็นผู้ดูแลในบัตรประจำตัวคนพิการ — ตอนนี้ได้ <strong>{money(allowed)}</strong>
      </InfoBlock>
    </>
  )
}

function QuestionBody({ q }: { q: Question }) {
  switch (q.q.kind) {
    case 'spouse':
      return <SpouseQuestion />
    case 'children':
      return <ChildrenQuestion />
    case 'parents':
      return <ParentsQuestion />
    case 'disabled':
      return <DisabledQuestion />
    default:
      return <MoneyQuestion key={q.n} q={q} />
  }
}

export function MobileFlow() {
  const { n } = useParams()
  const nav = useNavigate()
  const { ret, derived, dispatch } = useTaxReturn()
  const mobile = useIsMobile()
  const idx = Number(n)
  const q = questions.find((x) => x.n === idx)

  if (!q) return <Navigate to="/calc/q/1" replace />
  if (!mobile) return <Navigate to={`/calc/${q.step}`} replace />

  const next = () => {
    dispatch({ type: 'setStep', step: q.step })
    if (idx >= TOTAL_QUESTIONS) nav('/result')
    else nav(`/calc/q/${idx + 1}`)
  }
  const back = () => (idx <= 1 ? nav('/') : nav(`/calc/q/${idx - 1}`))
  const salaryAnnual = q.q.kind === 'salary' && ret.income.find((e) => e.id === SALARY_ID)!.enteredAs !== 'monthly'
  const title = salaryAnnual ? 'เงินเดือน ค่าจ้างทั้งปีเท่าไหร่' : q.title

  return (
    <div className={s.screen}>
      <div className={s.top}>
        <button type="button" className={s.back} onClick={back} aria-label="ย้อนกลับ">
          ←
        </button>
        <div className={s.progress}>
          <ProgressBar value={idx / TOTAL_QUESTIONS} height={4} label="ความคืบหน้า" />
        </div>
        <span className={s.counter}>
          {idx}/{TOTAL_QUESTIONS}
        </span>
      </div>
      <main className={s.body}>
        <div className={['eyebrow eyebrow--teal', s.group].join(' ')} style={{ textTransform: 'none' }}>
          {q.group}
        </div>
        <h2 className={s.h2}>{title}</h2>
        <p className={s.lead}>{q.lead}</p>
        <QuestionBody q={q} />
      </main>
      <footer className={s.footer}>
        <div className={s.running} role="status" aria-live="polite">
          <span className={s.runningLabel}>ภาษีตอนนี้</span>
          <span className={s.runningFig}>{money(derived.taxDue)}</span>
        </div>
        <div className={s.btns}>
          {q.skippable && <SkipButton q={q} onDone={next} />}
          <Button variant="primary" size="xl" onClick={next}>
            {idx >= TOTAL_QUESTIONS ? 'ดูผลลัพธ์' : 'ถัดไป'}
          </Button>
        </div>
      </footer>
    </div>
  )
}

function SkipButton({ q, onDone }: { q: Question; onDone: () => void }) {
  const m = useMoneyModel(q)
  const { dispatch } = useTaxReturn()
  const skip = () => {
    switch (q.q.kind) {
      case 'spouse':
        dispatch({ type: 'setProfile', profile: { hasSpouse: false, spouseHasIncome: false } })
        break
      case 'children':
        dispatch({ type: 'setProfile', profile: { childrenCount: 0, childrenBornFrom2561: 0 } })
        break
      case 'parents':
        dispatch({ type: 'setProfile', profile: { parentsSupported: 0 } })
        break
      case 'disabled':
        dispatch({ type: 'setProfile', profile: { disabledDependents: 0 } })
        break
      default:
        m.skip()
    }
    onDone()
  }
  return (
    <Button variant="ghost" size="xl" onClick={skip}>
      ข้าม
    </Button>
  )
}
