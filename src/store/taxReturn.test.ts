import { describe, expect, it } from 'vitest'
import { derive } from '../lib/tax/calc'
import { getTaxYearConfig } from '../lib/tax/config'
import { SALARY_ID, workedExample } from '../lib/tax/defaults'
import { buildPlans } from '../lib/tax/plans'
import { reducer, type State } from './taxReturn'

const cfg = getTaxYearConfig(2568)
const fresh = (): State => ({ ret: workedExample(), savedAt: 0, skipped: [] })
const salary = (s: State) => s.ret.income.find((e) => e.id === SALARY_ID)!

describe('salary entry mode (#19 / #9)', () => {
  it('monthly edits keep amount ≡ monthly × 12', () => {
    const s = reducer(fresh(), { type: 'setIncomeMonthly', id: SALARY_ID, monthly: 70_000 })
    expect(salary(s)).toMatchObject({ amount: 840_000, enteredAs: 'monthly' })
  })

  it('typing an annual total (wizard or ledger) switches the row to annual and keeps the exact figure', () => {
    const s = reducer(fresh(), { type: 'setIncome', id: SALARY_ID, amount: 1_000_000 })
    expect(salary(s)).toMatchObject({ amount: 1_000_000, enteredAs: 'annual' })
    // the bonus row has no mode and must not gain one
    const b = reducer(s, { type: 'setIncome', id: 'bonus', amount: 5 })
    expect(b.ret.income[1].enteredAs).toBeUndefined()
  })

  it('switching back to monthly snaps once to a multiple of 12; switching to annual never changes the figure', () => {
    let s = reducer(fresh(), { type: 'setIncome', id: SALARY_ID, amount: 1_000_000 })
    s = reducer(s, { type: 'setIncomeMode', id: SALARY_ID, mode: 'monthly' })
    expect(salary(s)).toMatchObject({ amount: 999_996, enteredAs: 'monthly' })
    s = reducer(s, { type: 'setIncomeMode', id: SALARY_ID, mode: 'annual' })
    expect(salary(s)).toMatchObject({ amount: 999_996, enteredAs: 'annual' })
    // re-selecting the current mode is a no-op
    expect(reducer(s, { type: 'setIncomeMode', id: SALARY_ID, mode: 'annual' }).ret).toBe(s.ret)
  })
})

describe('applied plan (#5)', () => {
  const plans = buildPlans(derive(workedExample(), cfg), cfg)
  const B = plans[1]
  const apply = (s: State, p = B) => reducer(s, { type: 'applyPlan', id: p.id, extras: { ssfExtra: p.ssfExtra, rmfExtra: p.rmfExtra, lifeExtra: p.lifeExtra, donation: p.donation } })

  it('applies on top of the pre-plan baseline and is idempotent', () => {
    const once = apply(fresh())
    expect(once.ret.deductions).toMatchObject({ ssf: 100_000, lifeInsurance: 40_000, donations: 5_000 })
    expect(once.ret.appliedPlan).toEqual({ id: 'B', baseline: { ssf: 40_000, rmf: 0, lifeInsurance: 25_000, donations: 0 } })
    const twice = apply(once)
    expect(twice.ret.deductions).toEqual(once.ret.deductions)
    expect(derive(twice.ret, cfg).taxDue).toBe(41_900)
  })

  it('switching plans replaces rather than stacks, and clearing restores the baseline', () => {
    const C = plans[2]
    const s = apply(apply(fresh()), C)
    expect(s.ret.deductions.ssf).toBe(40_000 + C.ssfExtra)
    expect(s.ret.appliedPlan?.id).toBe('C')
    const cleared = reducer(s, { type: 'clearPlan' })
    expect(cleared.ret.deductions).toMatchObject({ ssf: 40_000, rmf: 0, lifeInsurance: 25_000, donations: 0 })
    expect(cleared.ret.appliedPlan).toBeUndefined()
    expect(reducer(cleared, { type: 'clearPlan' })).toBe(cleared)
  })

  it('a manual edit to a plan-driven figure drops the applied plan marker', () => {
    const s = reducer(apply(fresh()), { type: 'setDeduction', key: 'ssf', value: 120_000 })
    expect(s.ret.appliedPlan).toBeUndefined()
    expect(s.ret.deductions.ssf).toBe(120_000)
    // unrelated deductions leave it in place
    const t = reducer(apply(fresh()), { type: 'setDeduction', key: 'homeLoanInterest', value: 10_000 })
    expect(t.ret.appliedPlan?.id).toBe('B')
  })
})

describe('attachments (#8)', () => {
  it('one file per required kind — a second of the same kind replaces, "other" accumulates', () => {
    let s = fresh()
    s = reducer(s, { type: 'addAttachment', attachment: { id: 'x1', kind: 'ssf', filename: 'ssf.pdf', size: 1, status: 'pending' } })
    s = reducer(s, { type: 'addAttachment', attachment: { id: 'x2', kind: 'ssf', filename: 'ssf-2.pdf', size: 1, status: 'pending' } })
    expect(s.ret.attachments.filter((a) => a.kind === 'ssf').map((a) => a.id)).toEqual(['x2'])
    s = reducer(s, { type: 'addAttachment', attachment: { id: 'o1', kind: 'other', filename: 'a.pdf', size: 1, status: 'pending' } })
    s = reducer(s, { type: 'addAttachment', attachment: { id: 'o2', kind: 'other', filename: 'b.pdf', size: 1, status: 'pending' } })
    expect(s.ret.attachments.filter((a) => a.kind === 'other')).toHaveLength(2)
  })
})
