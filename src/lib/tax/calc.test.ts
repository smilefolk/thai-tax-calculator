import { describe, expect, it } from 'vitest'
import { amountToDropBracket, derive, expenseByEntry, savingsFor, taxByBracket, taxOnNet } from './calc'
import { getTaxYearConfig } from './config'
import { blankReturn, workedExample } from './defaults'
import { buildPlans, savingsCurve } from './plans'
import type { IncomeEntry } from './types'

const cfg = getTaxYearConfig(2568)

describe('brackets', () => {
  const cases: Array<[number, number]> = [
    [0, 0],
    [150_000, 0],
    [150_001, 0], // rounds 0.05 → 0
    [300_000, 7_500],
    [300_001, 7_500],
    [500_000, 27_500],
    [750_000, 65_000],
    [1_000_000, 115_000],
    [2_000_000, 365_000],
    [5_000_000, 1_265_000],
    [6_000_000, 1_615_000],
  ]
  for (const [net, tax] of cases) {
    it(`net ${net} → tax ${tax}`, () => {
      expect(taxOnNet(net, cfg)).toBe(tax)
    })
  }

  it('marks the marginal band and amounts in band', () => {
    const rows = taxByBracket(676_000, cfg.brackets)
    expect(rows.map((r) => r.amountInBand)).toEqual([150_000, 150_000, 200_000, 176_000, 0, 0, 0, 0])
    expect(rows.map((r) => r.tax)).toEqual([0, 7_500, 20_000, 26_400, 0, 0, 0, 0])
    expect(rows.findIndex((r) => r.isMarginal)).toBe(3)
    expect(rows.filter((r) => r.reached)).toHaveLength(4)
  })

  it('negative net income is treated as zero', () => {
    expect(taxOnNet(-5, cfg)).toBe(0)
    expect(taxByBracket(-5, cfg.brackets).every((r) => !r.reached)).toBe(true)
  })
})

describe('expenses', () => {
  it('40(1)+40(2) share the 100,000 standard cap', () => {
    const income: IncomeEntry[] = [
      { id: 'a', category: '40(1)', amount: 150_000, expenseMethod: 'standard', actualExpense: 0 },
      { id: 'b', category: '40(2)', amount: 150_000, expenseMethod: 'standard', actualExpense: 0 },
    ]
    const by = expenseByEntry(income, cfg)
    expect(by.a).toBe(75_000)
    expect(by.b).toBe(25_000)
  })

  it('actual method uses the entered expense, never above income', () => {
    const income: IncomeEntry[] = [
      { id: 'a', category: '40(6)', amount: 100_000, expenseMethod: 'actual', actualExpense: 120_000 },
    ]
    expect(expenseByEntry(income, cfg).a).toBe(100_000)
  })

  it('dividends get no expense deduction', () => {
    const income: IncomeEntry[] = [
      { id: 'a', category: '40(4)', amount: 100_000, expenseMethod: 'standard', actualExpense: 0 },
    ]
    expect(expenseByEntry(income, cfg).a).toBe(0)
  })
})

describe('worked example (handoff)', () => {
  const d = derive(workedExample(), cfg)

  it('matches every figure on the design', () => {
    expect(d.grossIncome).toBe(910_000)
    expect(d.expenseDeduction).toBe(100_000)
    expect(d.totalDeductions).toBe(134_000)
    expect(d.netIncome).toBe(676_000)
    expect(d.taxDue).toBe(53_900)
    expect(d.withholding).toBe(58_000)
    expect(d.balance).toBe(4_100)
    expect(d.verdict).toBe('refund')
    expect(d.effectiveRate).toBeCloseTo(0.0592, 3)
    expect(d.marginalRate).toBe(0.15)
    expect(d.nextBracketDistance).toBe(74_000)
    expect(d.bracketProgress).toBeCloseTo(0.704, 3)
    expect(d.monthlyIncome).toBe(75_833)
    expect(d.monthlyTax).toBe(4_492)
  })

  it('SSF/RMF extra 60,000 saves 9,000 at the 15% band', () => {
    expect(savingsFor(60_000, d, cfg)).toBe(9_000)
  })

  it('reports unused allowances', () => {
    expect(d.unusedAllowanceByType.ssf).toBe(160_000)
    expect(d.unusedAllowanceByType.lifeInsurance).toBe(75_000)
    expect(d.unusedAllowanceByType.rmf).toBe(273_000)
  })

  it('amount to drop a bracket', () => {
    expect(amountToDropBracket(d)).toBe(176_000)
  })

  it('plan B reproduces the design numbers, plan C never over-deducts past the exempt band', () => {
    const [a, b, c] = buildPlans(d, cfg)
    expect(a.tax).toBe(53_900)
    expect(a.locked).toBe(0)
    expect(b.ssfExtra).toBe(60_000)
    expect(b.lifeExtra).toBe(15_000)
    expect(b.donation).toBe(5_000)
    expect(b.locked).toBe(80_000)
    expect(b.tax).toBe(41_900)
    expect(b.saved).toBe(12_000)
    expect(c.locked).toBeLessThanOrEqual(676_000 - 150_000)
    expect(c.tax).toBe(0)
    expect(c.saved).toBe(53_900)
  })

  it('savings curve is monotone with diminishing slope', () => {
    const pts = savingsCurve(d, cfg, 500_000, 20)
    expect(pts).toHaveLength(20)
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].saved).toBeGreaterThanOrEqual(pts[i - 1].saved)
      expect(pts[i].rate).toBeLessThanOrEqual(pts[i - 1].rate + 1e-9)
    }
    expect(pts[pts.length - 1].height).toBe(1)
  })
})

describe('deduction caps', () => {
  it('spouse allowance only when spouse has no income', () => {
    const r = workedExample()
    r.filerProfile = { ...r.filerProfile, hasSpouse: true, spouseHasIncome: false }
    r.deductions = { ...r.deductions, spouse: 60_000 }
    expect(derive(r, cfg).totalDeductions).toBe(194_000)
    r.filerProfile.spouseHasIncome = true
    expect(derive(r, cfg).totalDeductions).toBe(134_000)
  })

  it('children × 30,000', () => {
    const r = workedExample()
    r.filerProfile = { ...r.filerProfile, childrenCount: 2 }
    r.deductions = { ...r.deductions, children: 90_000 }
    const it = derive(r, cfg).deductionItems.find((i) => i.key === 'children')!
    expect(it.allowed).toBe(60_000)
  })

  it('health insurance sits inside the life-insurance ceiling', () => {
    const r = workedExample()
    r.deductions = { ...r.deductions, lifeInsurance: 90_000, healthInsurance: 25_000 }
    const items = derive(r, cfg).deductionItems
    expect(items.find((i) => i.key === 'lifeInsurance')!.allowed).toBe(90_000)
    expect(items.find((i) => i.key === 'healthInsurance')!.allowed).toBe(10_000)
  })

  it('retirement family caps at 500,000 combined and 30% of income each', () => {
    const r = workedExample()
    r.deductions = { ...r.deductions, ssf: 300_000, rmf: 300_000, pvd: 100_000 }
    const items = derive(r, cfg).deductionItems
    expect(items.find((i) => i.key === 'ssf')!.allowed).toBe(200_000)
    expect(items.find((i) => i.key === 'rmf')!.allowed).toBe(273_000)
    expect(items.find((i) => i.key === 'pvd')!.allowed).toBe(27_000)
  })

  it('donations capped at 10% of remaining net, double donations count twice', () => {
    const r = workedExample()
    r.deductions = { ...r.deductions, donations: 100_000, doubleDonations: 10_000 }
    const items = derive(r, cfg).deductionItems
    // remaining before donations = 810,000 − 134,000 = 676,000 → room 67,600
    expect(items.find((i) => i.key === 'doubleDonations')!.allowed).toBe(20_000)
    expect(items.find((i) => i.key === 'donations')!.allowed).toBe(47_600)
  })

  it('owed verdict when withholding is short', () => {
    const r = workedExample()
    r.withholding = { amount: 50_000, sources: [] }
    const d = derive(r, cfg)
    expect(d.verdict).toBe('owed')
    expect(d.balance).toBe(-3_900)
  })

  it('blank return has zero tax and even verdict', () => {
    const d = derive(blankReturn(), cfg)
    expect(d.taxDue).toBe(0)
    expect(d.verdict).toBe('even')
    expect(d.marginalBracket).toBeNull()
  })
})
