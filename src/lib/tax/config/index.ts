import type { TaxYearConfig } from '../types'
import { y2568 } from './y2568'

/** ปี 2567 ใช้อัตราเดียวกับ 2568 (ต่างเฉพาะวันยื่น) — เก็บไว้เพื่อให้แดชบอร์ดคำนวณย้อนหลังได้ */
const y2567: TaxYearConfig = {
  ...y2568,
  taxYear: 2567,
  filingOpens: '2025-01-01',
  filingDeadline: '2025-04-08',
}

const registry: Record<number, TaxYearConfig> = {
  2567: y2567,
  2568: y2568,
}

export const DEFAULT_TAX_YEAR = 2568

export function getTaxYearConfig(taxYear: number): TaxYearConfig {
  const cfg = registry[taxYear]
  if (!cfg) throw new Error(`No tax config for year ${taxYear}`)
  return cfg
}

export function availableTaxYears(): number[] {
  return Object.keys(registry)
    .map(Number)
    .sort((a, b) => b - a)
}
