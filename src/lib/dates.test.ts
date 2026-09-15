import { describe, expect, it } from 'vitest'
import { daysUntil, relativeTime, thaiDate } from './dates'

describe('daysUntil (#12)', () => {
  const deadline = '2026-04-08'
  it('counts calendar days, not 24-hour blocks', () => {
    expect(daysUntil(deadline, new Date(2026, 3, 7, 23, 59))).toBe(1)
    expect(daysUntil(deadline, new Date(2026, 3, 8, 0, 1))).toBe(0)
    expect(daysUntil(deadline, new Date(2026, 3, 8, 23, 59))).toBe(0)
  })
  it('the day after the deadline is −1, never −0', () => {
    const d = daysUntil(deadline, new Date(2026, 3, 9, 12, 0))
    expect(d).toBe(-1)
    expect(Object.is(d, -0)).toBe(false)
    expect(d < 0).toBe(true)
    expect(Object.is(daysUntil(deadline, new Date(2026, 3, 8, 12, 0)), -0)).toBe(false)
  })
  it('long ranges', () => {
    expect(daysUntil(deadline, new Date(2025, 11, 15))).toBe(114)
  })
})

describe('thaiDate / relativeTime', () => {
  it('formats Buddhist-era short dates', () => {
    expect(thaiDate('2026-04-08')).toBe('8 เม.ย. 2569')
  })
  it('relative time buckets', () => {
    const now = Date.now()
    expect(relativeTime(now - 10_000, now)).toBe('เมื่อสักครู่')
    expect(relativeTime(now - 2 * 60_000, now)).toBe('2 นาทีที่แล้ว')
  })
})
