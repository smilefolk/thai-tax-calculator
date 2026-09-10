import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { StepperHeader, STEPS, stepIndex } from '../../components/layout/StepperHeader'
import { SummaryBottomBar, SummaryRail } from '../../components/tax/SummaryRail'
import { Button } from '../../components/ui/Button'
import { useIsMobile, useIsNarrow } from '../../hooks/useMediaQuery'
import { useNow } from '../../hooks/useNow'
import { relativeTime } from '../../lib/dates'
import type { WizardStep } from '../../lib/tax/types'
import { useTaxReturn } from '../../store/taxReturn'
import { DeductionsStep } from './DeductionsStep'
import { FilerStep } from './FilerStep'
import { IncomeStep } from './IncomeStep'
import { stepToQuestion } from './questions'
import { SummaryStep } from './SummaryStep'
import s from './Wizard.module.css'

const isStep = (x: string | undefined): x is WizardStep => !!x && STEPS.some((st) => st.key === x)

const STEP_VIEW: Record<WizardStep, () => JSX.Element> = {
  filer: FilerStep,
  income: IncomeStep,
  deductions: DeductionsStep,
  summary: SummaryStep,
}

export function WizardLayout() {
  const { step } = useParams()
  const { ret, dispatch } = useTaxReturn()
  const narrow = useIsNarrow()
  const mobile = useIsMobile()

  useEffect(() => {
    if (isStep(step) && ret.ui.currentStep !== step) dispatch({ type: 'setStep', step })
  }, [step, ret.ui.currentStep, dispatch])

  if (!isStep(step)) return <Navigate to="/calc/income" replace />
  // phones use the one-question-per-screen flow
  if (mobile) return <Navigate to={`/calc/q/${stepToQuestion(step)}`} replace />
  const StepView = STEP_VIEW[step]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)' }}>
      <StepperHeader current={step} taxYear={ret.taxYear} ledgerLink />
      <div className={s.body}>
        <main className={s.main}>
          <StepView />
        </main>
        {narrow ? <SummaryBottomBar /> : <SummaryRail estimateDeductions={step === 'income' || step === 'filer'} />}
      </div>
    </div>
  )
}

export function StepIntro({ step, title, lead }: { step: WizardStep; title: string; lead: string }) {
  const idx = stepIndex(step)
  return (
    <>
      <div className="eyebrow eyebrow--teal">
        STEP {String(idx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
      </div>
      <h1 className={s.h1}>{title}</h1>
      <p className={s.lead}>{lead}</p>
    </>
  )
}

export function StepFooter({ step }: { step: WizardStep }) {
  const idx = stepIndex(step)
  const prev = STEPS[idx - 1]
  const next = STEPS[idx + 1]
  const nav = useNavigate()
  const { savedAt } = useTaxReturn()
  const now = useNow()
  return (
    <div className={s.footer}>
      {prev ? (
        <Button variant="ghost" style={{ padding: '12px 20px' }} onClick={() => nav(`/calc/${prev.key}`)}>
          ← ย้อนกลับ
        </Button>
      ) : (
        <Button variant="ghost" style={{ padding: '12px 20px' }} to="/">
          ← หน้าแรก
        </Button>
      )}
      <div className={s.footerRight}>
        <span className={s.autosave}>บันทึกร่างอัตโนมัติ · {relativeTime(savedAt, now)}</span>
        {next ? (
          <Button variant="primary" onClick={() => nav(`/calc/${next.key}`)}>
            ถัดไป: {next.label} →
          </Button>
        ) : (
          <Button variant="primary" onClick={() => nav('/result')}>
            ดูผลการคำนวณ →
          </Button>
        )}
      </div>
    </div>
  )
}
