import { effectiveExpenseMethod, familyDeductions } from './calc'
import { availableTaxYears, DEFAULT_TAX_YEAR, getTaxYearConfig } from './config'
import { blankReturn, BONUS_ID, emptyDeductions, SALARY_ID } from './defaults'
import type {
  Attachment,
  AttachmentKind,
  AttachmentStatus,
  DeductionKey,
  Deductions,
  ExpenseMethod,
  FilerProfile,
  IncomeCategory,
  IncomeEntry,
  TaxReturn,
  ViewMode,
  WizardStep,
} from './types'

const CATEGORIES: readonly IncomeCategory[] = ['40(1)', '40(2)', '40(4)', '40(5)', '40(6)', '40(8)']
const METHODS: readonly ExpenseMethod[] = ['standard', 'actual']
const STEPS: readonly WizardStep[] = ['filer', 'income', 'deductions', 'summary']
const VIEW_MODES: readonly ViewMode[] = ['wizard', 'ledger']
const FILING_METHODS: readonly TaxReturn['filingMethod'][] = ['online', 'download']
const ATTACHMENT_KINDS: readonly AttachmentKind[] = ['withholding-cert', 'life-insurance', 'ssf', 'rmf', 'other']
const ATTACHMENT_STATUSES: readonly AttachmentStatus[] = ['pending', 'uploading', 'verified', 'error', 'missing']
export const DEDUCTION_KEYS = Object.keys(emptyDeductions) as DeductionKey[]

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)
const money = (v: unknown, fallback = 0): number => Math.max(0, num(v, fallback))
const count = (v: unknown): number => Math.max(0, Math.round(num(v)))
const bool = (v: unknown): boolean => v === true
const oneOf = <T>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback)

/**
 * Coerce whatever was persisted into a well-formed TaxReturn for the current
 * build. Returns null only when the input isn't recognisably a return at all
 * (the caller should discard it); anything else is repaired field by field so
 * an older or hand-edited draft never reaches the reducer or the engine.
 */
export function normalizeReturn(raw: unknown): TaxReturn | null {
  if (!isObj(raw) || !Array.isArray(raw.income)) return null

  const base = blankReturn()
  const taxYear = availableTaxYears().includes(num(raw.taxYear, NaN)) ? (raw.taxYear as number) : DEFAULT_TAX_YEAR
  const cfg = getTaxYearConfig(taxYear)

  const p = isObj(raw.filerProfile) ? raw.filerProfile : {}
  const childrenCount = count(p.childrenCount)
  const filerProfile: FilerProfile = {
    hasSpouse: bool(p.hasSpouse),
    spouseHasIncome: bool(p.hasSpouse) && bool(p.spouseHasIncome),
    childrenCount,
    childrenBornFrom2561: Math.min(count(p.childrenBornFrom2561), childrenCount),
    parentsSupported: count(p.parentsSupported),
    disabledDependents: count(p.disabledDependents),
  }

  // income: keep well-formed entries (unique ids), then pin the two fixed 40(1) rows to the front
  const seen = new Set<string>()
  const entries: IncomeEntry[] = []
  for (const e of raw.income) {
    if (!isObj(e) || typeof e.id !== 'string' || seen.has(e.id)) continue
    const category = oneOf(e.category, CATEGORIES, null)
    if (!category) continue
    seen.add(e.id)
    const entry: IncomeEntry = {
      id: e.id,
      category: e.id === SALARY_ID || e.id === BONUS_ID ? '40(1)' : category,
      amount: money(e.amount),
      expenseMethod: oneOf(e.expenseMethod, METHODS, 'standard'),
      actualExpense: money(e.actualExpense),
    }
    // drop an `actual` election the category doesn't permit (e.g. a pre-#1 salary draft)
    entry.expenseMethod = effectiveExpenseMethod(entry, cfg)
    entries.push(entry)
  }
  const fixed = base.income.map((f) => entries.find((e) => e.id === f.id) ?? f)
  const income = [...fixed, ...entries.filter((e) => e.id !== SALARY_ID && e.id !== BONUS_ID)]

  const d = isObj(raw.deductions) ? raw.deductions : {}
  const deductions = { ...emptyDeductions } as Deductions
  for (const k of DEDUCTION_KEYS) deductions[k] = money(d[k], emptyDeductions[k])
  // figures that follow from the profile are never user-entered
  Object.assign(deductions, familyDeductions(filerProfile, cfg))
  deductions.personal = cfg.caps.personal

  const w = isObj(raw.withholding) ? raw.withholding : {}
  const withholding = {
    amount: money(w.amount),
    sources: Array.isArray(w.sources) ? w.sources.filter((s): s is string => typeof s === 'string') : [],
  }

  const attachments: Attachment[] = []
  if (Array.isArray(raw.attachments)) {
    for (const a of raw.attachments) {
      if (!isObj(a) || typeof a.id !== 'string' || typeof a.filename !== 'string') continue
      const kind = oneOf(a.kind, ATTACHMENT_KINDS, null)
      if (!kind || attachments.some((x) => x.id === a.id)) continue
      attachments.push({ id: a.id, kind, filename: a.filename, size: money(a.size), status: oneOf(a.status, ATTACHMENT_STATUSES, 'pending') })
    }
  }

  const u = isObj(raw.ui) ? raw.ui : {}
  return {
    taxYear,
    filerProfile,
    income,
    deductions,
    withholding,
    attachments,
    filingMethod: oneOf(raw.filingMethod, FILING_METHODS, base.filingMethod),
    ui: { currentStep: oneOf(u.currentStep, STEPS, base.ui.currentStep), viewMode: oneOf(u.viewMode, VIEW_MODES, base.ui.viewMode) },
  }
}

/** Filter an unknown value down to valid deduction keys. */
export function normalizeDeductionKeys(raw: unknown): DeductionKey[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((k): k is DeductionKey => DEDUCTION_KEYS.includes(k as DeductionKey))
}
