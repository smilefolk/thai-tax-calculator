import { DEFAULT_TAX_YEAR } from './config'
import type { Deductions, FilerProfile, IncomeEntry, TaxReturn } from './types'

export const emptyDeductions: Deductions = {
  personal: 60_000,
  spouse: 0,
  children: 0,
  parents: 0,
  disabled: 0,
  socialSecurity: 0,
  lifeInsurance: 0,
  healthInsurance: 0,
  parentHealthInsurance: 0,
  ssf: 0,
  rmf: 0,
  pvd: 0,
  nsf: 0,
  homeLoanInterest: 0,
  donations: 0,
  doubleDonations: 0,
  stimulusSchemes: 0,
}

export const emptyProfile: FilerProfile = {
  hasSpouse: false,
  spouseHasIncome: false,
  childrenCount: 0,
  childrenBornFrom2561: 0,
  parentsSupported: 0,
  disabledDependents: 0,
}

export const SALARY_ID = 'salary'
export const BONUS_ID = 'bonus'

/**
 * The handoff's worked example — 65,000/month + 130,000 bonus,
 * personal 60k · SSO 9k · life 25k · SSF 40k · withheld 58k → tax 53,900, refund 4,100.
 * Used as the first-run draft so the product opens on a meaningful state.
 */
export function workedExample(): TaxReturn {
  const income: IncomeEntry[] = [
    { id: SALARY_ID, category: '40(1)', amount: 780_000, expenseMethod: 'standard', actualExpense: 0, enteredAs: 'monthly' },
    { id: BONUS_ID, category: '40(1)', amount: 130_000, expenseMethod: 'standard', actualExpense: 0 },
  ]
  return {
    taxYear: DEFAULT_TAX_YEAR,
    filerProfile: { ...emptyProfile },
    income,
    deductions: { ...emptyDeductions, socialSecurity: 9_000, lifeInsurance: 25_000, ssf: 40_000 },
    withholding: { amount: 58_000, sources: ['50 ทวิ'] },
    attachments: [
      { id: 'a1', kind: 'withholding-cert', filename: '50ทวิ-2568.pdf', size: 248 * 1024, status: 'verified' },
      { id: 'a2', kind: 'life-insurance', filename: 'ประกันชีวิต-AIA.pdf', size: 96 * 1024, status: 'verified' },
    ],
    filingMethod: 'online',
    ui: { currentStep: 'income' },
  }
}

export function blankReturn(): TaxReturn {
  return {
    taxYear: DEFAULT_TAX_YEAR,
    filerProfile: { ...emptyProfile },
    income: [
      { id: SALARY_ID, category: '40(1)', amount: 0, expenseMethod: 'standard', actualExpense: 0, enteredAs: 'monthly' },
      { id: BONUS_ID, category: '40(1)', amount: 0, expenseMethod: 'standard', actualExpense: 0 },
    ],
    deductions: { ...emptyDeductions },
    withholding: { amount: 0, sources: [] },
    attachments: [],
    filingMethod: 'online',
    ui: { currentStep: 'filer' },
  }
}
