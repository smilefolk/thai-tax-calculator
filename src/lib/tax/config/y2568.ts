import type { TaxYearConfig } from '../types'

/**
 * ปีภาษี 2568 (TY2025) — ยื่นแบบ ม.ค.–เม.ย. 2569
 *
 * ⚠️ ตัวเลขทั้งหมดในไฟล์นี้อ้างอิงจาก design handoff และความรู้ทั่วไป
 * ต้องตรวจสอบกับประมวลรัษฎากร / ประกาศกรมสรรพากรฉบับล่าสุดก่อนใช้งานจริง
 */
export const y2568: TaxYearConfig = {
  taxYear: 2568,
  filingOpens: '2026-01-01',
  filingDeadline: '2026-04-08',
  instalmentThreshold: 3000,

  brackets: [
    { from: 0, to: 150_000, rate: 0 },
    { from: 150_000, to: 300_000, rate: 0.05 },
    { from: 300_000, to: 500_000, rate: 0.1 },
    { from: 500_000, to: 750_000, rate: 0.15 },
    { from: 750_000, to: 1_000_000, rate: 0.2 },
    { from: 1_000_000, to: 2_000_000, rate: 0.25 },
    { from: 2_000_000, to: 5_000_000, rate: 0.3 },
    { from: 5_000_000, to: Infinity, rate: 0.35 },
  ],

  expenseRules: {
    // 40(1) + 40(2) หักเหมา 50% รวมกันไม่เกิน 100,000 — หักตามจริงไม่ได้
    '40(1)': { type: 'standard', rate: 0.5, cap: 100_000, sharedCapGroup: 'salary', actualAllowed: false },
    '40(2)': { type: 'standard', rate: 0.5, cap: 100_000, sharedCapGroup: 'salary', actualAllowed: false },
    // ดอกเบี้ย / เงินปันผล หักค่าใช้จ่ายไม่ได้
    '40(4)': { type: 'none' },
    // ค่าเช่า (อาคาร) เหมา 30% หรือตามจริง
    '40(5)': { type: 'standard', rate: 0.3, actualAllowed: true },
    // วิชาชีพอิสระ (ทั่วไป) เหมา 30% หรือตามจริง
    '40(6)': { type: 'standard', rate: 0.3, actualAllowed: true },
    // ธุรกิจอื่น เหมา 60% หรือตามจริง
    '40(8)': { type: 'standard', rate: 0.6, actualAllowed: true },
  },

  caps: {
    personal: 60_000,
    spouse: 60_000,
    childEach: 30_000,
    parentEach: 30_000,
    disabledEach: 60_000,
    socialSecurity: 9_000,
    lifeInsurance: 100_000,
    healthInsurance: 25_000,
    parentHealthInsurance: 15_000,
    ssf: { rateOfIncome: 0.3, cap: 200_000 },
    rmf: { rateOfIncome: 0.3, cap: 500_000 },
    pvd: { rateOfIncome: 0.15, cap: 500_000 },
    nsf: 30_000,
    retirementCombined: 500_000,
    homeLoanInterest: 100_000,
    donationRateOfNet: 0.1,
    doubleDonationMultiplier: 2,
    stimulusSchemes: 50_000,
  },
}
