/**
 * Prior-year filing history. There is no server in this build, so earlier
 * years are fixtures; the current year always comes from the live model.
 */
export interface FilingRecord {
  taxYear: number
  form: 'ภ.ง.ด. 90' | 'ภ.ง.ด. 91'
  tax: number
  /** withholding − tax; positive = refunded */
  balance: number
  status: 'draft' | 'refunded' | 'paid'
}

export const priorYears: FilingRecord[] = [
  { taxYear: 2567, form: 'ภ.ง.ด. 91', tax: 47_200, balance: 2_300, status: 'refunded' },
  { taxYear: 2566, form: 'ภ.ง.ด. 90', tax: 42_100, balance: -1_850, status: 'paid' },
  { taxYear: 2565, form: 'ภ.ง.ด. 91', tax: 36_800, balance: 1_100, status: 'refunded' },
  { taxYear: 2564, form: 'ภ.ง.ด. 91', tax: 31_400, balance: -600, status: 'paid' },
]

export const user = {
  name: 'สมชาย ใจดี',
  title: 'นายสมชาย ใจดี',
  firstName: 'สมชาย',
  plan: 'แผน Pro',
  taxIdMasked: '3-1012-•••••-••-•',
  promptPay: '••••4471',
}
