import { taxOnNet } from './calc'
import type { DerivedTax, TaxYearConfig } from './types'

export interface PlanInputs {
  ssfExtra: number
  rmfExtra: number
  lifeExtra: number
  donation: number
}

export type Liquidity = 'high' | 'medium' | 'low'

export interface PlanOutcome extends PlanInputs {
  id: 'A' | 'B' | 'C'
  name: string
  blurb: string
  recommended: boolean
  tax: number
  saved: number
  locked: number
  liquidity: Liquidity
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step
const floorTo = (n: number, step: number) => Math.floor(n / step) * step
const clamp0 = (n: number) => (n > 0 ? n : 0)

interface Room {
  ssf: number
  rmf: number
  life: number
  donation: number
  /** how much deduction is still useful before net hits the 0% band */
  useful: number
}

function room(d: DerivedTax, cfg: TaxYearConfig): Room {
  const u = d.unusedAllowanceByType
  const retirementUsed = (['ssf', 'rmf', 'pvd', 'nsf'] as const).reduce(
    (s, k) => s + (d.deductionItems.find((i) => i.key === k)?.allowed ?? 0),
    0,
  )
  const retirementRoom = clamp0(cfg.caps.retirementCombined - retirementUsed)
  const ssf = Math.min(u.ssf ?? 0, retirementRoom)
  const rmf = Math.min(u.rmf ?? 0, clamp0(retirementRoom - ssf))
  const life = u.lifeInsurance ?? 0
  const exempt = cfg.brackets[0].to
  const useful = clamp0(d.netIncome - exempt)
  const donationItem = d.deductionItems.find((i) => i.key === 'donations')
  const donation = clamp0((donationItem?.cap ?? 0) - (donationItem?.allowed ?? 0))
  return { ssf, rmf, life, donation, useful }
}

export function evaluatePlan(inputs: PlanInputs, d: DerivedTax, cfg: TaxYearConfig) {
  const locked = inputs.ssfExtra + inputs.rmfExtra + inputs.lifeExtra + inputs.donation
  const tax = taxOnNet(clamp0(d.netIncome - locked), cfg)
  return { tax, saved: d.taxDue - tax, locked }
}

/**
 * Three plans computed from the user's own position:
 *  A — nothing extra
 *  B — "balanced": roughly a third of the money sitting in the marginal band into SSF,
 *      a fifth of remaining life-insurance room, and a small donation
 *  C — "max": fill every allowance, but never deduct below the exempt band
 */
export function buildPlans(d: DerivedTax, cfg: TaxYearConfig): PlanOutcome[] {
  const r = room(d, cfg)
  const inBand = d.marginalBracket ? d.netIncome - d.marginalBracket.from : 0

  const A: PlanInputs = { ssfExtra: 0, rmfExtra: 0, lifeExtra: 0, donation: 0 }

  const B: PlanInputs = {
    ssfExtra: Math.min(r.ssf, roundTo(inBand / 3, 10_000), r.useful),
    rmfExtra: 0,
    lifeExtra: Math.min(roundTo(r.life * 0.2, 5_000), r.life),
    donation: Math.min(roundTo(d.taxDue * 0.1, 5_000), r.donation),
  }
  // keep B inside the useful range
  {
    let budget = r.useful
    B.ssfExtra = Math.min(B.ssfExtra, budget)
    budget -= B.ssfExtra
    B.lifeExtra = Math.min(B.lifeExtra, floorTo(budget, 1_000))
    budget -= B.lifeExtra
    B.donation = Math.min(B.donation, floorTo(budget, 1_000))
  }

  const C: PlanInputs = { ssfExtra: 0, rmfExtra: 0, lifeExtra: 0, donation: 0 }
  {
    let budget = r.useful
    C.ssfExtra = Math.min(r.ssf, budget)
    budget -= C.ssfExtra
    C.lifeExtra = Math.min(r.life, budget)
    budget -= C.lifeExtra
    C.rmfExtra = Math.min(r.rmf, floorTo(budget, 1_000))
    budget -= C.rmfExtra
    C.donation = Math.min(r.donation, floorTo(budget, 1_000))
  }

  const mk = (
    id: PlanOutcome['id'],
    name: string,
    blurb: string,
    inputs: PlanInputs,
    liquidity: Liquidity,
    recommended = false,
  ): PlanOutcome => ({ id, name, blurb, recommended, liquidity, ...inputs, ...evaluatePlan(inputs, d, cfg) })

  return [
    mk('A', 'ไม่ทำอะไรเพิ่ม', 'ใช้เฉพาะสิทธิที่มีอยู่แล้ว ไม่ต้องเอาเงินไปล็อกที่ไหน', A, 'high'),
    mk('B', 'สมดุล', 'ลดภาษีลงหนึ่งขั้น โดยยังเหลือเงินสดไว้ใช้พอสมควร', B, 'medium', true),
    mk('C', 'ใช้สิทธิเต็มเพดาน', 'ภาษีต่ำสุดเท่าที่กฎหมายให้ แต่เงินก้อนใหญ่จะถูกล็อกยาว', C, 'low'),
  ]
}

export interface CurvePoint {
  locked: number
  saved: number
  /** 0..1 relative to the maximum saving */
  height: number
  /** marginal rate at which this slice of money was saved */
  rate: number
}

/** Diminishing-returns curve: tax saved as a function of money locked, in `steps` slices. */
export function savingsCurve(d: DerivedTax, cfg: TaxYearConfig, maxLocked: number, steps = 20): CurvePoint[] {
  if (maxLocked <= 0) return []
  const pts: CurvePoint[] = []
  let prevSaved = 0
  for (let i = 1; i <= steps; i++) {
    const locked = (maxLocked * i) / steps
    const tax = taxOnNet(clamp0(d.netIncome - locked), cfg)
    const saved = d.taxDue - tax
    const rate = (saved - prevSaved) / (maxLocked / steps)
    pts.push({ locked, saved, height: 0, rate })
    prevSaved = saved
  }
  const max = pts[pts.length - 1].saved || 1
  return pts.map((p) => ({ ...p, height: p.saved / max }))
}

/** Remaining SSF+RMF room usable by the mobile what-if slider. */
export function retirementRoom(d: DerivedTax, cfg: TaxYearConfig): number {
  const r = room(d, cfg)
  return Math.min(r.ssf + r.rmf, Math.max(r.useful, 0))
}
