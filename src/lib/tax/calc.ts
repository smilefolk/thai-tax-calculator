import type {
  Bracket,
  BracketResult,
  CappedDeduction,
  DeductionKey,
  Deductions,
  DerivedTax,
  ExpenseMethod,
  FilerProfile,
  IncomeCategory,
  IncomeEntry,
  TaxReturn,
  TaxYearConfig,
} from './types'

const clamp0 = (n: number) => (n > 0 ? n : 0)
const round = (n: number) => Math.round(n)

/* ---------------- income & expenses ---------------- */

export function grossIncome(income: IncomeEntry[]): number {
  return income.reduce((s, e) => s + clamp0(e.amount), 0)
}

export function incomeByCategory(income: IncomeEntry[]): Record<IncomeCategory, number> {
  const out: Record<IncomeCategory, number> = {
    '40(1)': 0,
    '40(2)': 0,
    '40(4)': 0,
    '40(5)': 0,
    '40(6)': 0,
    '40(8)': 0,
  }
  for (const e of income) out[e.category] += clamp0(e.amount)
  return out
}

/**
 * The expense method the engine will actually apply: 'actual' only where the
 * category's rule permits it (salary/commission 40(1)/40(2) never do).
 */
export function effectiveExpenseMethod(entry: IncomeEntry, cfg: TaxYearConfig): ExpenseMethod {
  const rule = cfg.expenseRules[entry.category]
  return rule.type === 'standard' && rule.actualAllowed && entry.expenseMethod === 'actual' ? 'actual' : 'standard'
}

/**
 * Expense deduction per entry, honouring per-category rules and
 * shared caps (40(1)+40(2) share one 100,000 ceiling).
 */
export function expenseByEntry(income: IncomeEntry[], cfg: TaxYearConfig): Record<string, number> {
  const out: Record<string, number> = {}
  const groupUsed: Record<string, number> = {}

  for (const e of income) {
    const rule = cfg.expenseRules[e.category]
    const amt = clamp0(e.amount)
    if (rule.type === 'none') {
      out[e.id] = 0
      continue
    }
    if (effectiveExpenseMethod(e, cfg) === 'actual') {
      out[e.id] = Math.min(clamp0(e.actualExpense), amt)
      continue
    }
    let allowed = amt * rule.rate
    if (rule.cap != null) {
      if (rule.sharedCapGroup) {
        const used = groupUsed[rule.sharedCapGroup] ?? 0
        allowed = Math.min(allowed, clamp0(rule.cap - used))
        groupUsed[rule.sharedCapGroup] = used + allowed
      } else {
        allowed = Math.min(allowed, rule.cap)
      }
    }
    out[e.id] = round(allowed)
  }
  return out
}

export function expenseDeduction(income: IncomeEntry[], cfg: TaxYearConfig): number {
  return Object.values(expenseByEntry(income, cfg)).reduce((s, n) => s + n, 0)
}

/** Standard-expense figure for the primary 40(1) group (used in UI copy) */
export function salaryExpenseCap(cfg: TaxYearConfig): number {
  const r = cfg.expenseRules['40(1)']
  return r.type === 'standard' && r.cap != null ? r.cap : 0
}

/** Standard-expense rate for 40(1) (0.5 in 2568) — UI copy must read it from here, never inline. */
export function salaryExpenseRate(cfg: TaxYearConfig): number {
  const r = cfg.expenseRules['40(1)']
  return r.type === 'standard' ? r.rate : 0
}

/** Only salary/wage income → ภ.ง.ด. 91; anything else → ภ.ง.ด. 90 */
export function isSalaryOnly(income: IncomeEntry[]): boolean {
  return income.every((e) => e.category === '40(1)')
}

export type FormCode = 'ภ.ง.ด. 90' | 'ภ.ง.ด. 91'
export function formFor(income: IncomeEntry[]): FormCode {
  return isSalaryOnly(income) ? 'ภ.ง.ด. 91' : 'ภ.ง.ด. 90'
}

/* ---------------- deductions ---------------- */

export interface DeductionContext {
  gross: number
  /** 40(1) wages only — the base for PVD */
  salaryIncome: number
  profile: FilerProfile
  cfg: TaxYearConfig
}

/**
 * Parents the filer may claim: their own two, plus the spouse's two only when the
 * spouse has no income (otherwise the spouse claims their own parents on their own return).
 */
export function maxParents(profile: FilerProfile): number {
  return profile.hasSpouse && !profile.spouseHasIncome ? 4 : 2
}

/** Maximum allowed for one deduction key given the filer's situation. */
export function deductionCap(key: DeductionKey, ctx: DeductionContext): number {
  const { caps } = ctx.cfg
  const { gross, salaryIncome, profile } = ctx
  switch (key) {
    case 'personal':
      return caps.personal
    case 'spouse':
      return profile.hasSpouse && !profile.spouseHasIncome ? caps.spouse : 0
    case 'children': {
      // every child gets childEach; the 2nd child onward born 2561+ gets childEachFrom2561.
      // The 2561+ children are assumed to be the youngest, so at most (count − 1) of them qualify.
      const n = clamp0(profile.childrenCount)
      const upgraded = Math.min(clamp0(profile.childrenBornFrom2561), clamp0(n - 1))
      return n * caps.childEach + upgraded * (caps.childEachFrom2561 - caps.childEach)
    }
    case 'parents':
      return Math.min(clamp0(profile.parentsSupported), maxParents(profile)) * caps.parentEach
    case 'disabled':
      return profile.disabledDependents * caps.disabledEach
    case 'socialSecurity':
      return caps.socialSecurity
    case 'lifeInsurance':
      return caps.lifeInsurance
    case 'healthInsurance':
      return caps.healthInsurance
    case 'parentHealthInsurance':
      return caps.parentHealthInsurance
    case 'ssf':
      return Math.min(gross * caps.ssf.rateOfIncome, caps.ssf.cap)
    case 'rmf':
      return Math.min(gross * caps.rmf.rateOfIncome, caps.rmf.cap)
    case 'pvd':
      return Math.min(salaryIncome * caps.pvd.rateOfIncome, caps.pvd.cap)
    case 'nsf':
      return caps.nsf
    case 'homeLoanInterest':
      return caps.homeLoanInterest
    case 'stimulusSchemes':
      return caps.stimulusSchemes
    case 'donations':
    case 'doubleDonations':
      // resolved after other deductions (10% of remaining net)
      return Infinity
  }
}

const FAMILY_KEYS = ['spouse', 'children', 'parents', 'disabled'] as const

/**
 * Deduction figures that follow purely from the filer profile — what the
 * store writes into `deductions` whenever the profile changes.
 */
export function familyDeductions(profile: FilerProfile, cfg: TaxYearConfig): Pick<Deductions, (typeof FAMILY_KEYS)[number]> {
  const ctx: DeductionContext = { gross: 0, salaryIncome: 0, profile, cfg }
  return {
    spouse: deductionCap('spouse', ctx),
    children: deductionCap('children', ctx),
    parents: deductionCap('parents', ctx),
    disabled: deductionCap('disabled', ctx),
  }
}

const RETIREMENT_KEYS: DeductionKey[] = ['ssf', 'rmf', 'pvd', 'nsf']

const ORDERED_KEYS: DeductionKey[] = [
  'personal',
  'spouse',
  'children',
  'parents',
  'disabled',
  'socialSecurity',
  'lifeInsurance',
  'healthInsurance',
  'parentHealthInsurance',
  'ssf',
  'rmf',
  'pvd',
  'nsf',
  'homeLoanInterest',
  'stimulusSchemes',
  'doubleDonations',
  'donations',
]

/**
 * Apply every cap: per-item, the life+health combined 100k,
 * the retirement combined 500k, then the two donation ceilings on what's left.
 */
export function cappedDeductions(
  d: Deductions,
  incomeAfterExpenses: number,
  ctx: DeductionContext,
): CappedDeduction[] {
  const { caps } = ctx.cfg
  const items: CappedDeduction[] = []
  const allowed: Partial<Record<DeductionKey, number>> = {}

  for (const key of ORDERED_KEYS) {
    if (key === 'donations' || key === 'doubleDonations') continue
    const entered = clamp0(d[key])
    const cap = deductionCap(key, ctx)
    allowed[key] = Math.min(entered, cap)
  }

  // health insurance counts inside the life-insurance ceiling
  const lifeRoom = clamp0(caps.lifeInsurance - (allowed.lifeInsurance ?? 0))
  allowed.healthInsurance = Math.min(allowed.healthInsurance ?? 0, lifeRoom)

  // retirement family shares one ceiling — trim in order ssf → rmf → pvd → nsf
  let retirementLeft = caps.retirementCombined
  for (const key of RETIREMENT_KEYS) {
    const v = Math.min(allowed[key] ?? 0, retirementLeft)
    allowed[key] = v
    retirementLeft -= v
  }

  let subtotal = 0
  for (const key of ORDERED_KEYS) {
    if (key === 'donations' || key === 'doubleDonations') continue
    subtotal += allowed[key] ?? 0
  }

  // donations are two sequential 10% ceilings, not one shared pool:
  //  1. double-deduction donations (education/sport/state hospitals) count twice,
  //     capped at 10% of (income − expenses − other deductions)
  //  2. general donations capped at 10% of what is left *after* step 1
  const remaining = clamp0(incomeAfterExpenses - subtotal)
  const doubleRoom = remaining * caps.donationRateOfNet
  const dbl = Math.min(clamp0(d.doubleDonations) * caps.doubleDonationMultiplier, doubleRoom)
  const donationRoom = clamp0(remaining - dbl) * caps.donationRateOfNet
  const normal = Math.min(clamp0(d.donations), donationRoom)
  allowed.doubleDonations = dbl
  allowed.donations = normal

  for (const key of ORDERED_KEYS) {
    const cap =
      key === 'doubleDonations' ? round(doubleRoom) : key === 'donations' ? round(donationRoom) : deductionCap(key, ctx)
    items.push({ key, entered: clamp0(d[key]), allowed: round(allowed[key] ?? 0), cap: round(cap) })
  }
  return items
}

export function totalDeductions(items: CappedDeduction[]): number {
  return items.reduce((s, i) => s + i.allowed, 0)
}

/* ---------------- brackets ---------------- */

export function taxByBracket(netIncome: number, brackets: Bracket[]): BracketResult[] {
  const net = clamp0(netIncome)
  let marginalIdx = -1
  const rows = brackets.map((b, i) => {
    const span = Math.min(net, b.to) - b.from
    const amountInBand = span > 0 ? span : 0
    const reached = net > b.from
    if (reached) marginalIdx = i
    return { ...b, amountInBand, tax: round(amountInBand * b.rate), reached, isMarginal: false }
  })
  if (marginalIdx >= 0) rows[marginalIdx].isMarginal = true
  return rows
}

export function taxOnNet(netIncome: number, cfg: TaxYearConfig): number {
  return taxByBracket(netIncome, cfg.brackets).reduce((s, r) => s + r.tax, 0)
}

/* ---------------- whole model ---------------- */

export function derive(ret: TaxReturn, cfg: TaxYearConfig): DerivedTax {
  const gross = grossIncome(ret.income)
  const byCategory = incomeByCategory(ret.income)
  const byEntry = expenseByEntry(ret.income, cfg)
  const expenses = Object.values(byEntry).reduce((s, n) => s + n, 0)
  const afterExpenses = clamp0(gross - expenses)

  const ctx: DeductionContext = { gross, salaryIncome: byCategory['40(1)'], profile: ret.filerProfile, cfg }
  const items = cappedDeductions(ret.deductions, afterExpenses, ctx)
  const deductions = totalDeductions(items)

  const net = clamp0(afterExpenses - deductions)
  const rows = taxByBracket(net, cfg.brackets)
  const taxDue = rows.reduce((s, r) => s + r.tax, 0)
  const withholding = clamp0(ret.withholding.amount)
  const balance = withholding - taxDue

  const marginal = rows.find((r) => r.isMarginal) ?? null
  const marginalIdx = marginal ? rows.indexOf(marginal) : -1
  // nothing taxed yet (net = 0) → sit at the very start of the exempt band, not at the top of it
  const nextBracket = marginal ? (marginalIdx + 1 < rows.length ? rows[marginalIdx + 1] : null) : (rows[1] ?? null)
  const nextDistance = marginal ? (Number.isFinite(marginal.to) ? marginal.to - net : Infinity) : rows[0].to - net
  const bracketProgress = marginal ? (Number.isFinite(marginal.to) ? (net - marginal.from) / (marginal.to - marginal.from) : 1) : 0

  const unused: Partial<Record<DeductionKey, number>> = {}
  for (const it of items) {
    if (Number.isFinite(it.cap)) unused[it.key] = clamp0(it.cap - it.allowed)
  }
  // life + health insurance share the 100,000 ceiling, so room left for either is what both leave
  const lifeAllowed = items.find((i) => i.key === 'lifeInsurance')?.allowed ?? 0
  const healthAllowed = items.find((i) => i.key === 'healthInsurance')?.allowed ?? 0
  const lifeFamilyRoom = clamp0(cfg.caps.lifeInsurance - lifeAllowed - healthAllowed)
  unused.lifeInsurance = lifeFamilyRoom
  unused.healthInsurance = Math.min(clamp0(cfg.caps.healthInsurance - healthAllowed), lifeFamilyRoom)
  const headlineKeys: DeductionKey[] = ['ssf', 'rmf', 'lifeInsurance', 'homeLoanInterest']
  let totalUnused = 0
  let totalCeiling = 0
  for (const k of headlineKeys) {
    const it = items.find((i) => i.key === k)
    if (!it) continue
    totalUnused += clamp0(it.cap - it.allowed)
    totalCeiling += it.cap
  }
  // retirement family can't exceed the combined ceiling in total
  const retirementUsed = RETIREMENT_KEYS.reduce((s, k) => s + (items.find((i) => i.key === k)?.allowed ?? 0), 0)
  const retirementRoom = clamp0(cfg.caps.retirementCombined - retirementUsed)
  const ssfRmfUnused = (unused.ssf ?? 0) + (unused.rmf ?? 0)
  if (ssfRmfUnused > retirementRoom) {
    totalUnused -= ssfRmfUnused - retirementRoom
  }

  return {
    grossIncome: gross,
    incomeByCategory: byCategory,
    expenseDeduction: expenses,
    expenseByEntry: byEntry,
    deductionItems: items,
    totalDeductions: deductions,
    netIncome: net,
    taxByBracket: rows,
    taxDue,
    withholding,
    balance,
    verdict: balance > 0 ? 'refund' : balance < 0 ? 'owed' : 'even',
    effectiveRate: gross > 0 ? taxDue / gross : 0,
    marginalRate: marginal?.rate ?? 0,
    marginalBracket: marginal,
    nextBracket,
    nextBracketDistance: nextDistance,
    bracketProgress: Math.max(0, Math.min(1, bracketProgress)),
    unusedAllowanceByType: unused,
    retirementUsed,
    retirementRoom,
    totalUnusedAllowance: round(totalUnused),
    totalAllowanceCeiling: round(totalCeiling),
    monthlyIncome: round(gross / 12),
    monthlyTax: round(taxDue / 12),
  }
}

/** Tax saved if `extraDeduction` more baht were deducted from net income. */
export function savingsFor(extraDeduction: number, derived: DerivedTax, cfg: TaxYearConfig): number {
  const newNet = clamp0(derived.netIncome - clamp0(extraDeduction))
  return derived.taxDue - taxOnNet(newNet, cfg)
}

/** Deduction needed to bring net income down to the top of the previous bracket. */
export function amountToDropBracket(derived: DerivedTax): number {
  const m = derived.marginalBracket
  if (!m || m.from === 0) return 0
  return derived.netIncome - m.from
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/**
 * Extra SSF/RMF the filer could still deduct this year, after every ceiling:
 * each fund's own cap, the combined retirement ceiling, and never below the exempt band.
 */
export function retirementHeadroom(derived: DerivedTax, cfg: TaxYearConfig): number {
  const u = derived.unusedAllowanceByType
  const room = Math.min((u.ssf ?? 0) + (u.rmf ?? 0), derived.retirementRoom)
  const useful = clamp0(derived.netIncome - cfg.brackets[0].to)
  return Math.min(room, useful)
}

/**
 * The one SSF/RMF nudge every screen shows: roughly a third of the money sitting in
 * the marginal band, rounded to 10,000, inside `retirementHeadroom`.
 */
export function ssfSuggestion(derived: DerivedTax, cfg: TaxYearConfig): { amount: number; saved: number } {
  const m = derived.marginalBracket
  const inBand = m ? derived.netIncome - m.from : 0
  const amount = clamp0(Math.min(retirementHeadroom(derived, cfg), roundTo(inBand / 3, 10_000)))
  return { amount, saved: amount > 0 ? savingsFor(amount, derived, cfg) : 0 }
}
