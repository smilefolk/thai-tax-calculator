import { InkChip } from '../../components/ui/Bits'
import { RadioCard } from '../../components/ui/RadioCard'
import { money } from '../../lib/format'
import { useTaxReturn } from '../../store/taxReturn'
import s from './Wizard.module.css'
import { StepFooter, StepIntro } from './WizardLayout'

function Counter({ label, value, onChange, max = 10, hint }: { label: string; value: number; onChange: (n: number) => void; max?: number; hint: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <div style={{ font: '500 13.5px/1.4 var(--sans)' }}>{label}</div>
        <div className={s.capHint} style={{ fontFamily: 'var(--sans)' }}>{hint}</div>
      </div>
      <div className={s.counter} role="group" aria-label={label}>
        <button type="button" className={s.counterBtn} onClick={() => onChange(Math.max(0, value - 1))} aria-label={`ลด ${label}`}>
          −
        </button>
        <span className={s.counterVal} aria-live="polite">
          {value}
        </span>
        <button type="button" className={s.counterBtn} onClick={() => onChange(Math.min(max, value + 1))} aria-label={`เพิ่ม ${label}`}>
          +
        </button>
      </div>
    </div>
  )
}

export function FilerStep() {
  const { ret, dispatch, cfg, derived } = useTaxReturn()
  const p = ret.filerProfile
  const setP = (patch: Partial<typeof p>) => dispatch({ type: 'setProfile', profile: patch })
  const onlySalary = ret.income.every((e) => e.category === '40(1)')
  const form = onlySalary ? 'ภ.ง.ด. 91' : 'ภ.ง.ด. 90'
  const familyTotal = derived.deductionItems.filter((i) => ['personal', 'spouse', 'children', 'parents', 'disabled'].includes(i.key)).reduce((a, i) => a + i.allowed, 0)

  return (
    <>
      <StepIntro step="filer" title="ข้อมูลผู้ยื่น" lead="ใช้กำหนดสิทธิลดหย่อนพื้นฐานและเลือกแบบฟอร์มให้ถูกต้อง ไม่ต้องกรอกเลขประจำตัวผู้เสียภาษีในขั้นตอนนี้" />

      <section className={s.card} aria-labelledby="filer-status">
        <div className={s.cardHead} style={{ marginBottom: 14 }}>
          <span id="filer-status" className={s.cardTitle}>
            สถานะสมรส
          </span>
          <span className={s.cardMeta}>ลดหย่อนส่วนตัว {money(cfg.caps.personal)} ได้ทุกคน</span>
        </div>
        <div className={s.radios} role="radiogroup" aria-label="สถานะสมรส">
          <RadioCard name="marital" selected={!p.hasSpouse} onSelect={() => setP({ hasSpouse: false, spouseHasIncome: false })} title="โสด / หย่า / หม้าย" sub="ยื่นแบบคนเดียว" />
          <RadioCard
            name="marital"
            selected={p.hasSpouse && !p.spouseHasIncome}
            onSelect={() => setP({ hasSpouse: true, spouseHasIncome: false })}
            title="สมรส · คู่สมรสไม่มีเงินได้"
            sub={<span className={s.radioSub}>ลดหย่อนเพิ่ม <strong>{money(cfg.caps.spouse)}</strong></span>}
          />
          <RadioCard name="marital" selected={p.hasSpouse && p.spouseHasIncome} onSelect={() => setP({ hasSpouse: true, spouseHasIncome: true })} title="สมรส · คู่สมรสมีเงินได้" sub="แยกยื่นหรือรวมยื่นได้" />
        </div>
      </section>

      <section className={s.card} aria-labelledby="filer-dep">
        <div className={s.cardHead}>
          <span id="filer-dep" className={s.cardTitle}>
            ผู้อยู่ในอุปการะ
          </span>
          <span className={s.cardMeta}>รวมลดหย่อนครอบครัว {money(familyTotal)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Counter label="บุตร" value={p.childrenCount} onChange={(n) => setP({ childrenCount: n })} hint={`คนละ ${money(cfg.caps.childEach)} (คนที่ 2 เกิดปี 2561+ ได้ 60,000)`} />
          <Counter label="บิดามารดาที่อุปการะ" value={p.parentsSupported} onChange={(n) => setP({ parentsSupported: n })} max={4} hint={`อายุ 60+ รายได้ไม่เกิน 30,000 · คนละ ${money(cfg.caps.parentEach)}`} />
          <Counter label="ผู้พิการ / ทุพพลภาพ" value={p.disabledDependents} onChange={(n) => setP({ disabledDependents: n })} max={4} hint={`คนละ ${money(cfg.caps.disabledEach)}`} />
        </div>
      </section>

      <section className={s.card} style={{ marginBottom: 0 }} aria-labelledby="filer-form">
        <div className={s.cardHead} style={{ marginBottom: 6 }}>
          <div className={s.cardHeadLeft}>
            <InkChip>{form}</InkChip>
            <span id="filer-form" className={s.cardTitle}>
              แบบที่จะยื่น
            </span>
          </div>
          <span className={s.cardMeta}>ระบบเลือกให้จากประเภทเงินได้</span>
        </div>
        <div className={s.cardSub} style={{ margin: 0 }}>
          {onlySalary ? 'มีเฉพาะเงินเดือน ค่าจ้าง โบนัส (40(1)) → ยื่น ภ.ง.ด. 91' : 'มีเงินได้ประเภทอื่นนอกจากเงินเดือน → ยื่น ภ.ง.ด. 90'}
        </div>
      </section>

      <StepFooter step="filer" />
    </>
  )
}
