/** Income categories per มาตรา 40 ประมวลรัษฎากร */
export type IncomeCategory = '40(1)' | '40(2)' | '40(4)' | '40(5)' | '40(6)' | '40(8)'

export type ExpenseMethod = 'standard' | 'actual'

/** How the user entered a 40(1) figure — drives which field the wizard shows and which is the source of truth. */
export type EntryMode = 'monthly' | 'annual'

export interface IncomeEntry {
  id: string
  category: IncomeCategory
  /** annual figure — always what the engine uses */
  amount: number
  expenseMethod: ExpenseMethod
  actualExpense: number
  /**
   * 'monthly' → `amount` was set as (monthly × 12) and the UI edits the monthly figure;
   * 'annual' (or unset) → `amount` was typed directly (e.g. from the 50 ทวิ total).
   */
  enteredAs?: EntryMode
}

export interface FilerProfile {
  hasSpouse: boolean
  spouseHasIncome: boolean
  childrenCount: number
  /**
   * How many of `childrenCount` were born in/after พ.ศ. 2561 — assumed to be the
   * youngest, so from the 2nd child onward they earn the higher allowance.
   */
  childrenBornFrom2561: number
  parentsSupported: number
  disabledDependents: number
}

export interface Deductions {
  personal: number
  spouse: number
  children: number
  parents: number
  disabled: number
  socialSecurity: number
  lifeInsurance: number
  healthInsurance: number
  parentHealthInsurance: number
  ssf: number
  rmf: number
  pvd: number
  nsf: number
  homeLoanInterest: number
  donations: number
  doubleDonations: number
  stimulusSchemes: number
}

export type DeductionKey = keyof Deductions

export type AttachmentKind = 'withholding-cert' | 'life-insurance' | 'ssf' | 'rmf' | 'other'
export type AttachmentStatus = 'pending' | 'uploading' | 'verified' | 'error' | 'missing'

export interface Attachment {
  id: string
  kind: AttachmentKind
  filename: string
  size: number
  status: AttachmentStatus
}

export type WizardStep = 'filer' | 'income' | 'deductions' | 'summary'

export interface TaxReturn {
  taxYear: number
  filerProfile: FilerProfile
  income: IncomeEntry[]
  /** Raw user-entered deductions (before caps); the engine applies every ceiling in `derive()`. */
  deductions: Deductions
  withholding: { amount: number; sources: string[] }
  attachments: Attachment[]
  filingMethod: 'online' | 'download'
  /**
   * A deduction plan the user applied from the planning page. `baseline` is what the
   * four plan-driven deductions were before, so applying is idempotent and reversible.
   */
  appliedPlan?: AppliedPlan
  ui: { currentStep: WizardStep }
}

export type PlanId = 'A' | 'B' | 'C'
export type PlanKey = 'ssf' | 'rmf' | 'lifeInsurance' | 'donations'
export interface AppliedPlan {
  id: PlanId
  baseline: Pick<Deductions, PlanKey>
}

/** ---------- Year-keyed rule config ---------- */

export interface Bracket {
  /** exclusive lower bound (amount above `from` is taxed) */
  from: number
  /** inclusive upper bound; Infinity for the top band */
  to: number
  rate: number
}

export interface StandardExpenseRule {
  type: 'standard'
  rate: number
  /** absolute cap on the deduction, if any */
  cap?: number
  /** categories sharing a combined cap (e.g. 40(1)+40(2)) */
  sharedCapGroup?: string
  /** whether the filer may elect actual expenses instead of the standard rate (false for 40(1)/40(2)) */
  actualAllowed: boolean
}
export interface NoExpenseRule {
  type: 'none'
}
export type ExpenseRule = StandardExpenseRule | NoExpenseRule

export interface RateCap {
  rateOfIncome: number
  cap: number
}

export interface DeductionCaps {
  personal: number
  spouse: number
  childEach: number
  /** 2nd child onward born in/after พ.ศ. 2561 */
  childEachFrom2561: number
  parentEach: number
  disabledEach: number
  socialSecurity: number
  lifeInsurance: number
  healthInsurance: number
  parentHealthInsurance: number
  ssf: RateCap
  rmf: RateCap
  pvd: RateCap
  nsf: number
  /** SSF + RMF + PVD + NSF combined ceiling */
  retirementCombined: number
  homeLoanInterest: number
  donationRateOfNet: number
  doubleDonationMultiplier: number
  stimulusSchemes: number
}

export interface TaxYearConfig {
  taxYear: number
  /** Gregorian filing deadline (paper/online) */
  filingDeadline: string
  filingOpens: string
  brackets: Bracket[]
  expenseRules: Record<IncomeCategory, ExpenseRule>
  caps: DeductionCaps
  /** minimum owed amount that qualifies for 3 instalments */
  instalmentThreshold: number
}

/** ---------- Derived model ---------- */

export interface BracketResult extends Bracket {
  amountInBand: number
  tax: number
  reached: boolean
  isMarginal: boolean
}

export interface CappedDeduction {
  key: DeductionKey
  entered: number
  allowed: number
  cap: number
}

export interface DerivedTax {
  grossIncome: number
  incomeByCategory: Record<IncomeCategory, number>
  expenseDeduction: number
  expenseByEntry: Record<string, number>
  deductionItems: CappedDeduction[]
  totalDeductions: number
  /** income − expenses − deductions (may be negative before clamping) */
  netIncome: number
  taxByBracket: BracketResult[]
  taxDue: number
  withholding: number
  /** withholding − taxDue; positive = refund */
  balance: number
  verdict: 'refund' | 'owed' | 'even'
  effectiveRate: number
  marginalRate: number
  marginalBracket: BracketResult | null
  nextBracket: Bracket | null
  nextBracketDistance: number
  /** progress within the marginal bracket 0..1 */
  bracketProgress: number
  unusedAllowanceByType: Partial<Record<DeductionKey, number>>
  /** SSF + RMF + PVD + NSF already counted against the combined ceiling */
  retirementUsed: number
  /** what is left under the combined retirement ceiling — every SSF/RMF suggestion must respect this */
  retirementRoom: number
  /** headline "remaining allowance" figure: SSF + RMF + life + home loan remaining */
  totalUnusedAllowance: number
  /** total cap of the allowance families counted above */
  totalAllowanceCeiling: number
  monthlyIncome: number
  monthlyTax: number
}
