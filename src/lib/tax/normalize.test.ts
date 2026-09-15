import { describe, expect, it } from 'vitest'
import { derive } from './calc'
import { DEFAULT_TAX_YEAR, getTaxYearConfig } from './config'
import { BONUS_ID, SALARY_ID, workedExample } from './defaults'
import { normalizeDeductionKeys, normalizeReturn } from './normalize'

describe('normalizeReturn', () => {
  it('rejects anything that is not recognisably a return', () => {
    expect(normalizeReturn(null)).toBeNull()
    expect(normalizeReturn('{}')).toBeNull()
    expect(normalizeReturn({})).toBeNull()
    expect(normalizeReturn({ income: 'nope' })).toBeNull()
    expect(normalizeReturn([])).toBeNull()
  })

  it('round-trips a well-formed return unchanged', () => {
    const r = workedExample()
    expect(normalizeReturn(JSON.parse(JSON.stringify(r)))).toEqual(r)
  })

  it('repairs the issue #4 drafts instead of throwing', () => {
    // unknown tax year + empty income (would have thrown "No tax config for year 2566")
    const a = normalizeReturn({ income: [], taxYear: 2566 })!
    expect(a.taxYear).toBe(DEFAULT_TAX_YEAR)
    expect(a.income.map((e) => e.id)).toEqual([SALARY_ID, BONUS_ID])
    expect(() => derive(a, getTaxYearConfig(a.taxYear))).not.toThrow()

    // income without the fixed salary/bonus rows (would have hit the non-null asserts in the wizard)
    const b = normalizeReturn({ income: [{ id: 'x', category: '40(6)', amount: 50_000 }] })!
    expect(b.income.map((e) => e.id)).toEqual([SALARY_ID, BONUS_ID, 'x'])
    expect(b.income[2]).toMatchObject({ category: '40(6)', amount: 50_000, expenseMethod: 'standard', actualExpense: 0 })
  })

  it('fills every missing block from the blank return and coerces bad values', () => {
    const r = normalizeReturn({
      income: [
        { id: SALARY_ID, category: '40(1)', amount: 'abc' },
        { id: 'dup', category: '40(5)', amount: 10 },
        { id: 'dup', category: '40(5)', amount: 20 },
        { id: 'bad', category: '40(9)', amount: 1 },
        'garbage',
      ],
      filerProfile: { hasSpouse: 'yes', childrenCount: -2, childrenBornFrom2561: 7 },
      deductions: { ssf: -5, rmf: 'x', bogus: 1 },
      withholding: { amount: -1, sources: ['50 ทวิ', 3] },
      attachments: [{ id: 'a', kind: 'ssf', filename: 'f.pdf', size: 'big', status: 'nope' }, { id: 'a', kind: 'ssf', filename: 'again.pdf' }, { kind: 'ssf' }],
      filingMethod: 'fax',
      ui: { currentStep: 'nowhere', viewMode: 'grid' },
    })!
    expect(r.income.map((e) => e.id)).toEqual([SALARY_ID, BONUS_ID, 'dup'])
    expect(r.income[0].amount).toBe(0)
    expect(r.income[2].amount).toBe(10)
    expect(r.filerProfile).toEqual({ hasSpouse: false, spouseHasIncome: false, childrenCount: 0, childrenBornFrom2561: 0, parentsSupported: 0, disabledDependents: 0 })
    expect(r.deductions.ssf).toBe(0)
    expect(r.deductions.rmf).toBe(0)
    expect(r.deductions.personal).toBe(60_000)
    expect('bogus' in r.deductions).toBe(false)
    expect(r.withholding).toEqual({ amount: 0, sources: ['50 ทวิ'] })
    expect(r.attachments).toEqual([{ id: 'a', kind: 'ssf', filename: 'f.pdf', size: 0, status: 'pending' }])
    expect(r.filingMethod).toBe('online')
    expect(r.ui).toEqual({ currentStep: 'filer' })
  })

  it('re-syncs profile-driven deductions and drops a disallowed actual-expense election', () => {
    const r = normalizeReturn({
      income: [{ id: SALARY_ID, category: '40(2)', amount: 780_000, expenseMethod: 'actual', actualExpense: 700_000 }],
      filerProfile: { hasSpouse: true, spouseHasIncome: false, childrenCount: 2, childrenBornFrom2561: 2, parentsSupported: 1 },
      deductions: { spouse: 1, children: 1, parents: 1, personal: 5 },
    })!
    expect(r.income[0]).toMatchObject({ category: '40(1)', expenseMethod: 'standard' })
    expect(r.deductions).toMatchObject({ spouse: 60_000, children: 90_000, parents: 30_000, personal: 60_000 })
  })
})

describe('normalizeDeductionKeys', () => {
  it('keeps only real keys', () => {
    expect(normalizeDeductionKeys(['ssf', 'nope', 3, 'rmf'])).toEqual(['ssf', 'rmf'])
    expect(normalizeDeductionKeys('ssf')).toEqual([])
  })
})

describe('normalizeReturn — #19/#9 entry mode and #5 applied plan', () => {
  it('infers the salary entry mode from divisibility when a draft predates it', () => {
    const monthly = normalizeReturn({ income: [{ id: SALARY_ID, category: '40(1)', amount: 780_000 }] })!
    expect(monthly.income[0].enteredAs).toBe('monthly')
    const annual = normalizeReturn({ income: [{ id: SALARY_ID, category: '40(1)', amount: 425_000 }] })!
    expect(annual.income[0].enteredAs).toBe('annual')
    // a stored 'monthly' flag on a figure that no longer divides by 12 is corrected
    const fixed = normalizeReturn({ income: [{ id: SALARY_ID, category: '40(1)', amount: 425_000, enteredAs: 'monthly' }] })!
    expect(fixed.income[0].enteredAs).toBe('annual')
    // the bonus row never carries a mode
    expect(monthly.income[1].enteredAs).toBeUndefined()
  })

  it('keeps an applied plan only when its baseline is complete', () => {
    const base = workedExample()
    const ok = normalizeReturn({ ...base, appliedPlan: { id: 'B', baseline: { ssf: 40_000, rmf: 0, lifeInsurance: 25_000, donations: 0 } } })!
    expect(ok.appliedPlan).toEqual({ id: 'B', baseline: { ssf: 40_000, rmf: 0, lifeInsurance: 25_000, donations: 0 } })
    const bad = normalizeReturn({ ...base, appliedPlan: { id: 'B', baseline: { ssf: 40_000 } } })!
    expect(bad.appliedPlan).toBeUndefined()
    const badId = normalizeReturn({ ...base, appliedPlan: { id: 'Z', baseline: { ssf: 0, rmf: 0, lifeInsurance: 0, donations: 0 } } })!
    expect(badId.appliedPlan).toBeUndefined()
  })
})
