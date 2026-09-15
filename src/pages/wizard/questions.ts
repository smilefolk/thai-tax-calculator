import type { DeductionKey, WizardStep } from '../../lib/tax/types'

/**
 * The mobile flow asks one question per screen. Thirteen questions, grouped
 * by the same four steps the desktop wizard uses.
 */
export type QuestionKind =
  /** the salary row: the screen offers a monthly × 12 / annual-total toggle */
  | { kind: 'salary' }
  | { kind: 'money-income'; incomeId: 'bonus' }
  | { kind: 'deduction'; key: DeductionKey }
  | { kind: 'withholding' }
  | { kind: 'spouse' }
  | { kind: 'children' }
  | { kind: 'parents' }
  | { kind: 'disabled' }

export interface Question {
  n: number
  step: WizardStep
  group: string
  title: string
  lead: string
  info?: string
  skippable: boolean
  q: QuestionKind
}

export const questions: Question[] = [
  {
    n: 1,
    step: 'income',
    group: 'รายได้',
    title: 'เงินเดือนต่อเดือนเท่าไหร่',
    lead: 'ยอดก่อนหักภาษีและประกันสังคม ดูจากสลิปเงินเดือนหรือหนังสือรับรอง 50 ทวิ',
    skippable: false,
    q: { kind: 'salary' },
  },
  {
    n: 2,
    step: 'income',
    group: 'รายได้',
    title: 'ปีนี้ได้โบนัสหรือค่าคอมมิชชั่นไหม',
    lead: 'รวมเงินได้ที่จ่ายครั้งเดียวเพราะเหตุออกจากงานด้วย ถ้าไม่มีกดข้ามได้เลย',
    skippable: true,
    q: { kind: 'money-income', incomeId: 'bonus' },
  },
  {
    n: 3,
    step: 'filer',
    group: 'ผู้ยื่น',
    title: 'สถานะสมรสของคุณ',
    lead: 'ถ้าคู่สมรสไม่มีเงินได้ คุณลดหย่อนเพิ่มได้ 60,000 บาท',
    skippable: true,
    q: { kind: 'spouse' },
  },
  {
    n: 4,
    step: 'filer',
    group: 'ผู้ยื่น',
    title: 'มีบุตรกี่คน',
    lead: 'บุตรที่อายุไม่เกิน 25 ปีและกำลังศึกษาอยู่ ลดหย่อนได้คนละ 30,000 บาท คนที่ 2 เป็นต้นไปที่เกิดปี 2561+ ได้ 60,000',
    skippable: true,
    q: { kind: 'children' },
  },
  {
    n: 5,
    step: 'filer',
    group: 'ผู้ยื่น',
    title: 'อุปการะบิดามารดากี่คน',
    lead: 'บิดามารดาอายุ 60 ปีขึ้นไปที่มีรายได้ไม่เกิน 30,000 บาทต่อปี ลดหย่อนได้คนละ 30,000 บาท',
    skippable: true,
    q: { kind: 'parents' },
  },
  {
    n: 6,
    step: 'filer',
    group: 'ผู้ยื่น',
    title: 'อุปการะผู้พิการหรือทุพพลภาพกี่คน',
    lead: 'ผู้ที่มีบัตรประจำตัวคนพิการหรือใบรับรองทุพพลภาพและมีรายได้ไม่เกิน 30,000 บาท ลดหย่อนได้คนละ 60,000 บาท',
    skippable: true,
    q: { kind: 'disabled' },
  },
  {
    n: 7,
    step: 'deductions',
    group: 'ค่าลดหย่อน',
    title: 'ปีนี้ซื้อกองทุน SSF ไปเท่าไหร่',
    lead: 'ดูจากหนังสือรับรองที่ บลจ. ส่งให้ทางอีเมล ถ้าไม่ได้ซื้อกดข้ามได้เลย',
    info: 'SSF ลดหย่อนได้ไม่เกิน 30% ของรายได้ และไม่เกิน 200,000 บาท',
    skippable: true,
    q: { kind: 'deduction', key: 'ssf' },
  },
  {
    n: 8,
    step: 'deductions',
    group: 'ค่าลดหย่อน',
    title: 'ซื้อกองทุน RMF ไปเท่าไหร่',
    lead: 'ต้องถือจนอายุ 55 ปีและซื้อต่อเนื่อง ถ้าไม่ได้ซื้อกดข้ามได้เลย',
    info: 'RMF ลดหย่อนได้ไม่เกิน 30% ของรายได้ รวมกับ SSF/PVD แล้วไม่เกิน 500,000 บาท',
    skippable: true,
    q: { kind: 'deduction', key: 'rmf' },
  },
  {
    n: 9,
    step: 'deductions',
    group: 'ค่าลดหย่อน',
    title: 'จ่ายเบี้ยประกันชีวิตไปเท่าไหร่',
    lead: 'เฉพาะกรมธรรม์ที่คุ้มครองตั้งแต่ 10 ปีขึ้นไป ดูจากหนังสือรับรองของบริษัทประกัน',
    info: 'ประกันชีวิตลดหย่อนได้ไม่เกิน 100,000 บาท (รวมประกันสุขภาพไม่เกิน 25,000)',
    skippable: true,
    q: { kind: 'deduction', key: 'lifeInsurance' },
  },
  {
    n: 10,
    step: 'deductions',
    group: 'ค่าลดหย่อน',
    title: 'ประกันสังคมทั้งปีเท่าไหร่',
    lead: 'พนักงานบริษัทส่วนใหญ่ถูกหักเดือนละ 750 บาท รวมทั้งปี 9,000 บาท',
    info: 'ประกันสังคมลดหย่อนได้ตามที่จ่ายจริง ไม่เกิน 9,000 บาท',
    skippable: true,
    q: { kind: 'deduction', key: 'socialSecurity' },
  },
  {
    n: 11,
    step: 'deductions',
    group: 'ค่าลดหย่อน',
    title: 'ดอกเบี้ยกู้ซื้อบ้านทั้งปี',
    lead: 'ดูจากหนังสือรับรองดอกเบี้ยของธนาคาร ถ้าไม่มีกดข้าม',
    info: 'ดอกเบี้ยเงินกู้ยืมเพื่อที่อยู่อาศัยลดหย่อนได้ไม่เกิน 100,000 บาท',
    skippable: true,
    q: { kind: 'deduction', key: 'homeLoanInterest' },
  },
  {
    n: 12,
    step: 'deductions',
    group: 'ค่าลดหย่อน',
    title: 'เงินบริจาคทั่วไปทั้งปี',
    lead: 'ต้องมีใบเสร็จหรือ e-Donation จากองค์กรที่กรมสรรพากรรับรอง',
    info: 'เงินบริจาคลดหย่อนได้ไม่เกิน 10% ของเงินได้หลังหักค่าใช้จ่ายและค่าลดหย่อนอื่น',
    skippable: true,
    q: { kind: 'deduction', key: 'donations' },
  },
  {
    n: 13,
    step: 'summary',
    group: 'ภาษีหัก ณ ที่จ่าย',
    title: 'ถูกหักภาษี ณ ที่จ่ายไว้เท่าไหร่',
    lead: 'ดูช่อง "ภาษีที่หักและนำส่งไว้" ในหนังสือรับรอง 50 ทวิ ตัวเลขนี้ตัดสินว่าคุณจะได้เงินคืนหรือต้องจ่ายเพิ่ม',
    skippable: true,
    q: { kind: 'withholding' },
  },
]

export const TOTAL_QUESTIONS = questions.length

export function stepToQuestion(step: WizardStep): number {
  return questions.find((q) => q.step === step)?.n ?? 1
}
