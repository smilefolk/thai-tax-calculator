import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { derive, familyDeductions } from '../lib/tax/calc'
import { availableTaxYears, getTaxYearConfig } from '../lib/tax/config'
import { blankReturn, workedExample } from '../lib/tax/defaults'
import { normalizeDeductionKeys, normalizeReturn } from '../lib/tax/normalize'
import type {
  Attachment,
  AttachmentStatus,
  DeductionKey,
  DerivedTax,
  ExpenseMethod,
  FilerProfile,
  IncomeCategory,
  IncomeEntry,
  TaxReturn,
  TaxYearConfig,
  WizardStep,
} from '../lib/tax/types'

const STORAGE_KEY = 'pasee-ngai:draft:v1'
/** bump when the persisted shape changes in a way normalizeReturn() can't repair */
const PERSIST_VERSION = 2

interface State {
  ret: TaxReturn
  savedAt: number
  /** deduction keys the user explicitly skipped (mobile "ข้าม") */
  skipped: DeductionKey[]
}

interface Persisted extends State {
  version: number
}

/** Drop the saved draft — the escape hatch when a stored state can't be rendered. */
export function clearDraftStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
}

type Action =
  | { type: 'reset'; ret: TaxReturn }
  | { type: 'setIncome'; id: string; amount: number }
  | { type: 'setIncomeMethod'; id: string; method: ExpenseMethod; actualExpense?: number }
  | { type: 'addIncome'; category: IncomeCategory }
  | { type: 'removeIncome'; id: string }
  | { type: 'setDeduction'; key: DeductionKey; value: number }
  | { type: 'skipDeduction'; key: DeductionKey }
  | { type: 'setProfile'; profile: Partial<FilerProfile> }
  | { type: 'setWithholding'; amount: number }
  | { type: 'setStep'; step: WizardStep }
  | { type: 'setTaxYear'; year: number }
  | { type: 'setViewMode'; mode: TaxReturn['ui']['viewMode'] }
  | { type: 'setFilingMethod'; method: TaxReturn['filingMethod'] }
  | { type: 'addAttachment'; attachment: Attachment }
  | { type: 'setAttachmentStatus'; id: string; status: AttachmentStatus }
  | { type: 'removeAttachment'; id: string }

function reducer(state: State, a: Action): State {
  const ret = state.ret
  const touch = (next: TaxReturn, extra: Partial<State> = {}): State => ({
    ...state,
    ...extra,
    ret: next,
    savedAt: Date.now(),
  })
  switch (a.type) {
    case 'reset':
      return { ret: a.ret, savedAt: Date.now(), skipped: [] }
    case 'setIncome':
      return touch({ ...ret, income: ret.income.map((e) => (e.id === a.id ? { ...e, amount: a.amount } : e)) })
    case 'setIncomeMethod':
      return touch({
        ...ret,
        income: ret.income.map((e) =>
          e.id === a.id ? { ...e, expenseMethod: a.method, actualExpense: a.actualExpense ?? e.actualExpense } : e,
        ),
      })
    case 'addIncome': {
      const entry: IncomeEntry = {
        id: `${a.category}-${Math.random().toString(36).slice(2, 8)}`,
        category: a.category,
        amount: 0,
        expenseMethod: 'standard',
        actualExpense: 0,
      }
      return touch({ ...ret, income: [...ret.income, entry] })
    }
    case 'removeIncome':
      return touch({ ...ret, income: ret.income.filter((e) => e.id !== a.id) })
    case 'setDeduction':
      return touch(
        { ...ret, deductions: { ...ret.deductions, [a.key]: a.value } },
        { skipped: state.skipped.filter((k) => k !== a.key) },
      )
    case 'skipDeduction':
      return touch(
        { ...ret, deductions: { ...ret.deductions, [a.key]: 0 } },
        { skipped: state.skipped.includes(a.key) ? state.skipped : [...state.skipped, a.key] },
      )
    case 'setProfile': {
      const profile = { ...ret.filerProfile, ...a.profile }
      // the 2561+ subset can never exceed the total
      profile.childrenBornFrom2561 = Math.min(profile.childrenBornFrom2561, profile.childrenCount)
      // keep entered family figures in sync with the profile
      const deductions = { ...ret.deductions, ...familyDeductions(profile, getTaxYearConfig(ret.taxYear)) }
      return touch({ ...ret, filerProfile: profile, deductions })
    }
    case 'setWithholding':
      return touch({ ...ret, withholding: { ...ret.withholding, amount: a.amount } })
    case 'setStep':
      return { ...state, ret: { ...ret, ui: { ...ret.ui, currentStep: a.step } } }
    case 'setTaxYear':
      return availableTaxYears().includes(a.year) ? touch({ ...ret, taxYear: a.year }) : state
    case 'setViewMode':
      return { ...state, ret: { ...ret, ui: { ...ret.ui, viewMode: a.mode } } }
    case 'setFilingMethod':
      return touch({ ...ret, filingMethod: a.method })
    case 'addAttachment':
      return touch({ ...ret, attachments: [...ret.attachments.filter((x) => x.kind !== a.attachment.kind || x.kind === 'other'), a.attachment] })
    case 'setAttachmentStatus':
      return touch({
        ...ret,
        attachments: ret.attachments.map((x) => (x.id === a.id ? { ...x, status: a.status } : x)),
      })
    case 'removeAttachment':
      return touch({ ...ret, attachments: ret.attachments.filter((x) => x.id !== a.id) })
  }
}

const fresh = (): State => ({ ret: workedExample(), savedAt: Date.now(), skipped: [] })

/**
 * Restore the autosaved draft. Every field is run through normalizeReturn()
 * so a draft from an older build, another tax year, or a hand-edited
 * localStorage never throws inside render; a draft that isn't a return at
 * all is deleted so it can't trip the next load either.
 */
function load(): State {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return fresh()
  }
  if (!raw) return fresh()
  try {
    const p: unknown = JSON.parse(raw)
    if (typeof p === 'object' && p !== null) {
      const { ret, savedAt, skipped } = p as Partial<Persisted>
      const normalized = normalizeReturn(ret)
      if (normalized) {
        return {
          ret: normalized,
          savedAt: typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : Date.now(),
          skipped: normalizeDeductionKeys(skipped),
        }
      }
    }
  } catch {
    /* corrupt JSON */
  }
  clearDraftStorage()
  return fresh()
}

interface Ctx {
  ret: TaxReturn
  cfg: TaxYearConfig
  derived: DerivedTax
  savedAt: number
  skipped: DeductionKey[]
  dispatch: (a: Action) => void
  resetToExample: () => void
  clearAll: () => void
}

const TaxContext = createContext<Ctx | null>(null)

export function TaxReturnProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const cfg = useMemo(() => getTaxYearConfig(state.ret.taxYear), [state.ret.taxYear])
  const derived = useMemo(() => derive(state.ret, cfg), [state.ret, cfg])

  // autosave draft
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    try {
      const p: Persisted = { version: PERSIST_VERSION, ret: state.ret, savedAt: state.savedAt, skipped: state.skipped }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch {
      /* storage unavailable */
    }
  }, [state])

  const resetToExample = useCallback(() => dispatch({ type: 'reset', ret: workedExample() }), [])
  const clearAll = useCallback(() => dispatch({ type: 'reset', ret: blankReturn() }), [])

  const value = useMemo<Ctx>(
    () => ({ ret: state.ret, cfg, derived, savedAt: state.savedAt, skipped: state.skipped, dispatch, resetToExample, clearAll }),
    [state, cfg, derived, resetToExample, clearAll],
  )
  return <TaxContext.Provider value={value}>{children}</TaxContext.Provider>
}

export function useTaxReturn(): Ctx {
  const ctx = useContext(TaxContext)
  if (!ctx) throw new Error('useTaxReturn must be used inside TaxReturnProvider')
  return ctx
}
