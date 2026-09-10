import { Link } from 'react-router-dom'
import type { WizardStep } from '../../lib/tax/types'
import { Avatar } from '../ui/Bits'
import { Logo } from '../ui/Logo'
import s from './StepperHeader.module.css'

export const STEPS: { key: WizardStep; label: string }[] = [
  { key: 'filer', label: 'ผู้ยื่น' },
  { key: 'income', label: 'รายได้' },
  { key: 'deductions', label: 'ค่าลดหย่อน' },
  { key: 'summary', label: 'สรุป' },
]

export function stepIndex(step: WizardStep) {
  return STEPS.findIndex((x) => x.key === step)
}

export function StepperHeader({ current, taxYear, ledgerLink }: { current: WizardStep; taxYear: number; ledgerLink?: boolean }) {
  const idx = stepIndex(current)
  return (
    <header className={s.bar}>
      <Logo />
      <nav className={s.steps} aria-label="ขั้นตอน">
        {STEPS.map((st, i) => {
          const state = i < idx ? 'done' : i === idx ? 'current' : 'future'
          const inner = (
            <>
              <span className={s.dot} aria-hidden="true">
                {state === 'done' ? '✓' : i + 1}
              </span>
              <span className={s.label}>{st.label}</span>
            </>
          )
          return (
            <span key={st.key} style={{ display: 'contents' }}>
              {i > 0 && <span className={s.rule} aria-hidden="true" />}
              {state === 'done' ? (
                <Link to={`/calc/${st.key}`} className={s.step} data-state={state} aria-label={`${st.label} (เสร็จแล้ว)`}>
                  {inner}
                </Link>
              ) : (
                <span className={s.step} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
                  {inner}
                </span>
              )}
            </span>
          )
        })}
      </nav>
      <div className={s.right}>
        {ledgerLink && (
          <Link to="/calc/ledger" className={s.toggle}>
            มุมมองสมุดบัญชี
          </Link>
        )}
        <span className={s.year}>ปีภาษี {taxYear}</span>
        <Avatar />
      </div>
    </header>
  )
}
