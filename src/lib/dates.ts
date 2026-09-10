const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

export const toBE = (gregorianYear: number) => gregorianYear + 543

/** "2026-04-08" → "8 เม.ย. 2569" */
export function thaiDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${THAI_MONTHS_SHORT[m - 1]} ${toBE(y)}`
}

/** whole days from `now` until the ISO date (end of that day); negative when past */
export function daysUntil(iso: string, now: Date = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number)
  const target = new Date(y, m - 1, d, 23, 59, 59)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 12) return 'สวัสดีตอนเช้า'
  if (h < 17) return 'สวัสดีตอนบ่าย'
  return 'สวัสดีตอนเย็น'
}

/** "2 นาทีที่แล้ว" style relative time */
export function relativeTime(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 45) return 'เมื่อสักครู่'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} นาทีที่แล้ว`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`
  return `${Math.round(h / 24)} วันที่แล้ว`
}
