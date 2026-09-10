import { InkChip } from '../../components/ui/Bits'
import { MoneyInput } from '../../components/ui/MoneyInput'
import { RadioCard } from '../../components/ui/RadioCard'
import { money, pctInt } from '../../lib/format'
import { salaryExpenseCap } from '../../lib/tax/calc'
import { BONUS_ID, SALARY_ID } from '../../lib/tax/defaults'
import type { IncomeCategory, IncomeEntry } from '../../lib/tax/types'
import { useTaxReturn } from '../../store/taxReturn'
import s from './Wizard.module.css'
import { StepFooter, StepIntro } from './WizardLayout'

const OTHER: { category: IncomeCategory; label: string; title: string; hint: string }[] = [
  { category: '40(2)', label: 'รับจ้างทั่วไป 40(2)', title: 'รับจ้างทั่วไป ค่านายหน้า', hint: 'หักเหมา 50% รวมกับเงินเดือนไม่เกิน 100,000' },
  { category: '40(6)', label: 'วิชาชีพอิสระ 40(6)', title: 'วิชาชีพอิสระ', hint: 'หักเหมา 30% (แพทย์ 60%) หรือตามจริง' },
  { category: '40(5)', label: 'ค่าเช่า 40(5)', title: 'ค่าเช่าทรัพย์สิน', hint: 'หักเหมา 30% สำหรับอาคาร' },
  { category: '40(4)', label: 'เงินปันผล 40(4)', title: 'ดอกเบี้ย เงินปันผล', hint: 'หักค่าใช้จ่ายไม่ได้ เลือกไม่นำมารวมได้ถ้าถูกหักภาษีแล้ว' },
]

function OtherIncomeCard({ entry }: { entry: IncomeEntry }) {
  const { dispatch, derived, cfg } = useTaxReturn()
  const meta = OTHER.find((o) => o.category === entry.category)!
  const rule = cfg.expenseRules[entry.category]
  const expense = derived.expenseByEntry[entry.id] ?? 0
  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <div className={s.cardHeadLeft}>
          <InkChip>{entry.category}</InkChip>
          <span className={s.cardTitle}>{meta.title}</span>
        </div>
        <button type="button" className={s.remove} onClick={() => dispatch({ type: 'removeIncome', id: entry.id })}>
          ลบรายการ
        </button>
      </div>
      <div className={s.grid2}>
        <MoneyInput
          label="รายได้ทั้งปี"
          value={entry.amount}
          onChange={(n) => dispatch({ type: 'setIncome', id: entry.id, amount: n })}
          helper={meta.hint}
        />
        {rule.type === 'standard' && rule.actualAllowed && (
          <div>
            <div style={{ font: '500 12px/1.4 var(--sans)', color: 'var(--ink-muted)', marginBottom: 7 }}>วิธีหักค่าใช้จ่าย</div>
            <div className={s.radios}>
              <RadioCard
                name={`method-${entry.id}`}
                selected={entry.expenseMethod === 'standard'}
                onSelect={() => dispatch({ type: 'setIncomeMethod', id: entry.id, method: 'standard' })}
                title={`เหมา ${pctInt(rule.rate)}`}
                sub={<span className={s.radioSub}>หักได้ <strong>{money(entry.expenseMethod === 'standard' ? expense : Math.min(entry.amount * rule.rate, rule.cap ?? Infinity))}</strong></span>}
              />
              <RadioCard
                name={`method-${entry.id}`}
                selected={entry.expenseMethod === 'actual'}
                onSelect={() => dispatch({ type: 'setIncomeMethod', id: entry.id, method: 'actual' })}
                title="ตามจริง"
                sub="ต้องแนบหลักฐาน"
              />
            </div>
          </div>
        )}
      </div>
      {rule.type === 'standard' && rule.actualAllowed && entry.expenseMethod === 'actual' && (
        <div className={s.grid2} style={{ marginTop: 16 }}>
          <MoneyInput
            label="ค่าใช้จ่ายจริงทั้งปี"
            value={entry.actualExpense}
            onChange={(n) => dispatch({ type: 'setIncomeMethod', id: entry.id, method: 'actual', actualExpense: n })}
            helper="ต้องแนบหลักฐานค่าใช้จ่ายตอนยื่นแบบ"
          />
        </div>
      )}
    </div>
  )
}

export function IncomeStep() {
  const { ret, derived: d, dispatch, cfg } = useTaxReturn()
  const salary = ret.income.find((e) => e.id === SALARY_ID)!
  const bonus = ret.income.find((e) => e.id === BONUS_ID)!
  const others = ret.income.filter((e) => e.id !== SALARY_ID && e.id !== BONUS_ID)
  const monthly = Math.round(salary.amount / 12)
  const cat1 = d.incomeByCategory['40(1)']
  const cap = salaryExpenseCap(cfg)
  const salaryRule = cfg.expenseRules['40(1)']
  const salaryRate = salaryRule.type === 'standard' ? salaryRule.rate : 0
  const standardAmount = ret.income.filter((e) => e.category === '40(1)').reduce((sum, e) => sum + (d.expenseByEntry[e.id] ?? 0), 0)
  const atCap = standardAmount >= cap
  const availableOther = OTHER.filter((o) => !others.some((e) => e.category === o.category))

  return (
    <>
      <StepIntro step="income" title={`รายได้ทั้งปี ${ret.taxYear}`} lead="กรอกยอดก่อนหักภาษี ระบบจะรวมและหักค่าใช้จ่ายให้อัตโนมัติ ดูผลได้ทันทีทางขวา" />

      <section className={s.card} aria-labelledby="inc1">
        <div className={s.cardHead}>
          <div className={s.cardHeadLeft}>
            <InkChip>40(1)</InkChip>
            <span id="inc1" className={s.cardTitle}>
              เงินเดือน ค่าจ้าง โบนัส
            </span>
          </div>
          <span className={s.cardMeta}>จากหนังสือรับรอง 50 ทวิ</span>
        </div>
        <div className={s.grid2}>
          <MoneyInput
            label="เงินเดือนต่อเดือน"
            value={monthly}
            autoFocus
            onChange={(n) => dispatch({ type: 'setIncome', id: SALARY_ID, amount: n * 12 })}
            helper={`× 12 เดือน = ${money(monthly * 12)}`}
            helperMono
          />
          <MoneyInput
            label="โบนัส / ค่าคอมมิชชั่น"
            value={bonus.amount}
            onChange={(n) => dispatch({ type: 'setIncome', id: BONUS_ID, amount: n })}
            helper="รวมเงินได้ที่จ่ายครั้งเดียวเพราะเหตุออกจากงานด้วย"
          />
        </div>
        <div className={s.total}>
          <span className={s.totalLabel}>รวมเงินได้ประเภทที่ 1</span>
          <span className={s.totalFig}>{money(cat1)}</span>
        </div>
      </section>

      {others.map((e) => (
        <OtherIncomeCard key={e.id} entry={e} />
      ))}

      <section className={s.card} aria-labelledby="inc-other">
        <div className={s.cardHead} style={{ marginBottom: 14 }}>
          <span id="inc-other" className={s.cardTitle}>
            เงินได้ประเภทอื่น
          </span>
          <span className={s.cardMeta}>{others.length ? `${others.length} รายการ` : 'ยังไม่มีรายการ'}</span>
        </div>
        <div className={s.chips}>
          {availableOther.map((o) => (
            <button key={o.category} type="button" className={s.chip} onClick={() => dispatch({ type: 'addIncome', category: o.category })}>
              + {o.label}
            </button>
          ))}
          {availableOther.length === 0 && <span className={s.cardMeta}>เพิ่มครบทุกประเภทแล้ว</span>}
        </div>
      </section>

      <section className={s.card} style={{ marginBottom: 0 }} aria-labelledby="inc-exp">
        <div className={s.cardHead}>
          <span id="inc-exp" className={s.cardTitle}>
            หักค่าใช้จ่ายเงินได้ประเภทที่ 1
          </span>
          <span className={s.cardMeta}>
            เหมา {pctInt(salaryRate)} ไม่เกิน {money(cap)}
          </span>
        </div>
        <div className={s.cardSub} style={{ margin: '0 0 12px' }}>
          เงินเดือน ค่าจ้าง โบนัส (40(1)) และค่านายหน้า (40(2)) หักค่าใช้จ่ายได้แบบเหมาเท่านั้น เลือกหักตามจริงไม่ได้
        </div>
        <div className={s.total}>
          <span className={s.totalLabel}>หักได้</span>
          <span className={s.totalFig}>
            {money(standardAmount)}
            {atCap && <span style={{ font: '400 13px var(--sans)', color: 'var(--ink-muted)', marginLeft: 8 }}>เต็มเพดาน</span>}
          </span>
        </div>
      </section>

      <StepFooter step="income" />
    </>
  )
}
