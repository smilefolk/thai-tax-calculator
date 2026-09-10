import { ProgressBar } from '../../components/ui/Bits'
import { MoneyInput } from '../../components/ui/MoneyInput'
import { money } from '../../lib/format'
import type { DeductionKey } from '../../lib/tax/types'
import { useTaxReturn } from '../../store/taxReturn'
import s from './Wizard.module.css'
import { StepFooter, StepIntro } from './WizardLayout'

interface Field {
  key: DeductionKey
  label: string
  hint?: string
}

const GROUPS: { title: string; meta?: string; fields: Field[] }[] = [
  {
    title: 'ประกันและสวัสดิการ',
    fields: [
      { key: 'socialSecurity', label: 'ประกันสังคม' },
      { key: 'lifeInsurance', label: 'เบี้ยประกันชีวิต', hint: 'กรมธรรม์ 10 ปีขึ้นไป' },
      { key: 'healthInsurance', label: 'เบี้ยประกันสุขภาพ', hint: 'รวมกับประกันชีวิตไม่เกิน 100,000' },
      { key: 'parentHealthInsurance', label: 'ประกันสุขภาพบิดามารดา' },
    ],
  },
  {
    title: 'กองทุนเพื่อการเกษียณ',
    meta: 'รวมกันไม่เกิน 500,000',
    fields: [
      { key: 'ssf', label: 'กองทุน SSF', hint: '30% ของรายได้ ไม่เกิน 200,000' },
      { key: 'rmf', label: 'กองทุน RMF', hint: '30% ของรายได้' },
      { key: 'pvd', label: 'กองทุนสำรองเลี้ยงชีพ (PVD)', hint: '15% ของค่าจ้าง' },
      { key: 'nsf', label: 'กองทุนการออมแห่งชาติ (กอช.)' },
    ],
  },
  {
    title: 'อื่นๆ',
    fields: [
      { key: 'homeLoanInterest', label: 'ดอกเบี้ยกู้ซื้อบ้าน' },
      { key: 'stimulusSchemes', label: 'มาตรการรัฐ (Easy E-Receipt ฯลฯ)' },
      { key: 'donations', label: 'เงินบริจาคทั่วไป', hint: '10% ของเงินได้หลังหักลดหย่อน' },
      { key: 'doubleDonations', label: 'บริจาคการศึกษา/กีฬา (2 เท่า)', hint: 'นับ 2 เท่า ภายในเพดาน 10%' },
    ],
  },
]

export function DeductionsStep() {
  const { ret, derived: d, dispatch, cfg } = useTaxReturn()
  const item = (k: DeductionKey) => d.deductionItems.find((i) => i.key === k)!
  const retirementUsed = (['ssf', 'rmf', 'pvd', 'nsf'] as DeductionKey[]).reduce((a, k) => a + item(k).allowed, 0)

  return (
    <>
      <StepIntro step="deductions" title={`ค่าลดหย่อนปี ${ret.taxYear}`} lead="กรอกยอดที่จ่ายจริง ระบบจะจำกัดตามเพดานของแต่ละรายการให้เอง ถ้าไม่มีรายการไหนเว้นว่างไว้ได้" />

      <section className={s.card} aria-labelledby="ded-basic">
        <div className={s.cardHead} style={{ marginBottom: 10 }}>
          <span id="ded-basic" className={s.cardTitle}>
            ลดหย่อนพื้นฐาน
          </span>
          <span className={s.cardMeta}>จากข้อมูลผู้ยื่น</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 26px' }}>
          {(['personal', 'spouse', 'children', 'parents', 'disabled'] as DeductionKey[])
            .map((k) => ({ k, it: item(k) }))
            .filter(({ it }) => it.allowed > 0)
            .map(({ k, it }) => (
              <span key={k} style={{ font: '400 13px/1.5 var(--sans)', color: 'var(--ink-muted)' }}>
                {{ personal: 'ส่วนตัว', spouse: 'คู่สมรส', children: 'บุตร', parents: 'บิดามารดา', disabled: 'ผู้พิการ' }[k as 'personal']}{' '}
                <strong className="num" style={{ color: 'var(--ink)', fontWeight: 600 }}>
                  {money(it.allowed)}
                </strong>
              </span>
            ))}
        </div>
      </section>

      {GROUPS.map((g, gi) => (
        <section key={g.title} className={s.card} aria-labelledby={`ded-g${gi}`}>
          <div className={s.cardHead}>
            <span id={`ded-g${gi}`} className={s.cardTitle}>
              {g.title}
            </span>
            {g.meta && <span className={s.cardMeta}>{g.meta}</span>}
          </div>
          {gi === 1 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ font: '500 12.5px var(--sans)', color: 'var(--ink-muted)' }}>ใช้สิทธิรวมไปแล้ว</span>
                <span className="num" style={{ font: '600 12.5px var(--mono)' }}>
                  {money(retirementUsed)} / {money(cfg.caps.retirementCombined)}
                </span>
              </div>
              <ProgressBar value={retirementUsed / cfg.caps.retirementCombined} height={6} label="เพดานรวมกองทุนเกษียณ" />
            </div>
          )}
          <div className={s.grid2} style={{ marginBottom: 0 }}>
            {g.fields.map((f) => {
              const it = item(f.key)
              const over = it.entered > it.allowed
              return (
                <MoneyInput
                  key={f.key}
                  label={f.label}
                  value={ret.deductions[f.key]}
                  onChange={(n) => dispatch({ type: 'setDeduction', key: f.key, value: n })}
                  invalid={over}
                  helper={
                    <span className={s.capHint} data-over={over}>
                      {over ? `ใช้ได้ ${money(it.allowed)} จากที่กรอก ${money(it.entered)}` : Number.isFinite(it.cap) ? `เพดาน ${money(it.cap)}${f.hint ? ` · ${f.hint}` : ''}` : f.hint}
                    </span>
                  }
                />
              )
            })}
          </div>
        </section>
      ))}

      <section className={s.card} style={{ marginBottom: 0 }} aria-labelledby="ded-wht">
        <div className={s.cardHead}>
          <span id="ded-wht" className={s.cardTitle}>
            ภาษีหัก ณ ที่จ่าย
          </span>
          <span className={s.cardMeta}>จากหนังสือรับรอง 50 ทวิ ทุกฉบับ</span>
        </div>
        <div className={s.grid2} style={{ marginBottom: 0 }}>
          <MoneyInput
            label="ภาษีที่ถูกหักไว้แล้วทั้งปี"
            value={ret.withholding.amount}
            onChange={(n) => dispatch({ type: 'setWithholding', amount: n })}
            helper="ตัวเลขนี้ตัดสินว่าคุณจะได้เงินคืนหรือต้องจ่ายเพิ่ม"
          />
        </div>
      </section>

      <StepFooter step="deductions" />
    </>
  )
}
