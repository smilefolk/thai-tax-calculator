import { LedgerRow } from '../../components/ui/Bits'
import { Button } from '../../components/ui/Button'
import { money } from '../../lib/format'
import { useTaxReturn } from '../../store/taxReturn'
import s from './Wizard.module.css'
import { StepFooter, StepIntro } from './WizardLayout'

export function SummaryStep() {
  const { ret, derived: d, cfg } = useTaxReturn()
  const abs = Math.abs(d.balance)
  return (
    <>
      <StepIntro step="summary" title="ตรวจสอบก่อนดูผล" lead="ทุกบรรทัดด้านล่างคำนวณจากสิ่งที่คุณกรอก แก้ได้ทุกเมื่อโดยกดกลับไปที่ขั้นตอนนั้น" />

      <div className={s.verdict} data-tone={d.verdict} role="status">
        <div className={s.verdictIcon} style={{ background: d.verdict === 'refund' ? 'var(--green)' : d.verdict === 'owed' ? 'var(--clay-strong)' : 'var(--ink-ghost)' }}>
          {d.verdict === 'refund' ? '↓' : d.verdict === 'owed' ? '!' : '='}
        </div>
        <div style={{ flex: 1 }}>
          <div className={s.verdictTitle}>
            {d.verdict === 'refund' && (
              <>
                คุณขอคืนภาษีได้ <span className="num">{money(abs)}</span> บาท
              </>
            )}
            {d.verdict === 'owed' && (
              <>
                คุณต้องชำระเพิ่ม <span className="num">{money(abs)}</span> บาท
              </>
            )}
            {d.verdict === 'even' && 'ภาษีที่หักไว้พอดีกับภาษีที่ต้องชำระ'}
          </div>
          <div className={s.verdictSub}>
            หัก ณ ที่จ่ายไว้ {money(d.withholding)} · ภาษีที่คำนวณได้ {money(d.taxDue)}
            {d.verdict === 'owed' && abs >= cfg.instalmentThreshold && ' · ผ่อนได้ 3 งวดโดยไม่มีดอกเบี้ย'}
          </div>
        </div>
      </div>

      <section className={s.card} style={{ marginBottom: 0 }} aria-label="สรุปรายการ">
        <div className="eyebrow eyebrow--teal" style={{ marginBottom: 4 }}>
          ก · เงินได้พึงประเมิน
        </div>
        {ret.income.map((e) => (
          <LedgerRow key={e.id} label={e.id === 'salary' ? 'เงินเดือน ค่าจ้าง 40(1)' : e.id === 'bonus' ? 'โบนัส' : `เงินได้ ${e.category}`} value={e.amount} />
        ))}
        <LedgerRow label="รวมเงินได้" value={d.grossIncome} total />
        <div className="eyebrow eyebrow--teal" style={{ margin: '22px 0 4px' }}>
          ข · หักค่าใช้จ่าย
        </div>
        <LedgerRow label="ค่าใช้จ่ายรวม" value={d.expenseDeduction} total negative />
        <div className="eyebrow eyebrow--teal" style={{ margin: '22px 0 4px' }}>
          ค · หักค่าลดหย่อน
        </div>
        {d.deductionItems
          .filter((i) => i.allowed > 0)
          .map((i) => (
            <LedgerRow key={i.key} label={LABELS[i.key]} value={i.allowed} compact />
          ))}
        <LedgerRow label="รวมค่าลดหย่อน" value={d.totalDeductions} total negative />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '20px 0 4px' }}>
          <span style={{ font: '600 17px/1.4 var(--sans)' }}>เงินได้สุทธิ</span>
          <span className="num" style={{ font: '600 26px var(--mono)', letterSpacing: '-.02em' }}>
            {money(d.netIncome)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0 0' }}>
          <span style={{ font: '600 17px/1.4 var(--sans)' }}>ภาษีที่ต้องชำระ</span>
          <span className="num" style={{ font: '600 26px var(--mono)', letterSpacing: '-.02em', color: 'var(--teal)' }}>
            {money(d.taxDue)}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="md" to="/calc/ledger">
            เปิดมุมมองสมุดบัญชี
          </Button>
          <Button variant="secondary" size="md" to="/plan">
            วางแผนลดหย่อนปีหน้า
          </Button>
        </div>
      </section>

      <StepFooter step="summary" />
    </>
  )
}

export const LABELS: Record<string, string> = {
  personal: 'ส่วนตัว',
  spouse: 'คู่สมรส',
  children: 'บุตร',
  parents: 'บิดามารดา',
  disabled: 'ผู้พิการ',
  socialSecurity: 'ประกันสังคม',
  lifeInsurance: 'ประกันชีวิต',
  healthInsurance: 'ประกันสุขภาพ',
  parentHealthInsurance: 'ประกันสุขภาพบิดามารดา',
  ssf: 'กองทุน SSF',
  rmf: 'กองทุน RMF',
  pvd: 'กองทุนสำรองเลี้ยงชีพ',
  nsf: 'กอช.',
  homeLoanInterest: 'ดอกเบี้ยบ้าน',
  stimulusSchemes: 'มาตรการรัฐ',
  donations: 'เงินบริจาค',
  doubleDonations: 'บริจาค 2 เท่า',
}
