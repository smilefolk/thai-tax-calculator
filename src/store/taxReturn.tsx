import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { derive } from '../lib/tax/calc'
import { getTaxYearConfig } from '../lib/tax/config'
import { blankReturn, workedExample } from '../lib/tax/defaults'
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

interface Persisted {
  ret: TaxReturn
  savedAt: number
  /** deduction keys the user explicitly skipped (mobile "ข้าม") */
  skipped: DeductionKey[]
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

interface State extends Persisted {}

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
      // keep entered spouse/children figures in sync with the profile
      const deductions = { ...ret.deductions }
      const cfg = getTaxYearConfig(ret.taxYear)
      deductions.spouse = profile.hasSpouse && !profile.spouseHasIncome ? cfg.caps.spouse : 0
      deductions.children = profile.childrenCount * cfg.caps.childEach
      deductions.parents = profile.parentsSupported * cfg.caps.parentEach
      deductions.disabled = profile.disabledDependents * cfg.caps.disabledEach
      return touch({ ...ret, filerProfile: profile, deductions })
    }
    case 'setWithholding':
      return touch({ ...ret, withholding: { ...ret.withholding, amount: a.amount } })
    case 'setStep':
      return { ...state, ret: { ...ret, ui: { ...ret.ui, currentStep: a.step } } }
    case 'setTaxYear':
      return touch({ ...ret, taxYear: a.year })
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

function load(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Persisted
      if (p && p.ret && p.ret.income) return { ret: p.ret, savedAt: p.savedAt ?? Date.now(), skipped: p.skipped ?? [] }
    }
  } catch {
    /* ignore corrupt drafts */
  }
  return { ret: workedExample(), savedAt: Date.now(), skipped: [] }
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
      const p: Persisted = { ret: state.ret, savedAt: state.savedAt, skipped: state.skipped }
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
