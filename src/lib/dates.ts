import type { ISODate, ISODateTime, Week } from '@/types/domain'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Weeks start on Monday (open product question; change here if that moves). */
export const WEEK_STARTS_ON = 1

const locale = 'en-US'

const weekdayMonthDay = new Intl.DateTimeFormat(locale, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})
const monthDay = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' })
const timeOfDay = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' })

/** Parse "2026-10-30" as a local calendar date (not UTC midnight). */
export function parseISODate(date: ISODate): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(date: Date): ISODate {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "4 min ago", "2 hours ago", "yesterday", "Oct 20". */
export function formatRelative(iso: ISODateTime, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime())
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) return `${Math.round(diff / MINUTE)} min ago`
  if (diff < DAY) {
    const h = Math.round(diff / HOUR)
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  if (diff < 2 * DAY) return 'yesterday'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`
  return monthDay.format(new Date(iso))
}

/** Whole days since a moment, e.g. for "no activity for 9 days". */
export function daysSince(iso: ISODateTime, now: number = Date.now()): number {
  return Math.floor(Math.max(0, now - new Date(iso).getTime()) / DAY)
}

/** "Mon, Oct 26 at 11:30 AM" */
export function formatDateTime(iso: ISODateTime): string {
  const d = new Date(iso)
  return `${weekdayMonthDay.format(d)} at ${timeOfDay.format(d)}`
}

/** "11:30 AM" today, otherwise "Mon 11:30 AM". */
export function formatTimeShort(iso: ISODateTime, now: number = Date.now()): string {
  const d = new Date(iso)
  const sameDay = toISODate(d) === toISODate(new Date(now))
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d)
  return sameDay ? timeOfDay.format(d) : `${weekday} ${timeOfDay.format(d)}`
}

/** "Fri, Oct 30" */
export function formatDueDate(date: ISODate): string {
  return weekdayMonthDay.format(parseISODate(date))
}

/** "Oct 20" */
export function formatMonthDay(iso: ISODateTime | ISODate): string {
  return monthDay.format(iso.length === 10 ? parseISODate(iso) : new Date(iso))
}

/** "Mon, Oct 26 – Sun, Nov 1" */
export function formatWeekRange(week: Week): string {
  return `${formatDueDate(week.start)} – ${formatDueDate(week.end)}`
}

/** "Oct 19–25" or "Oct 26 – Nov 1" */
export function formatWeekShort(week: Week): string {
  const start = parseISODate(week.start)
  const end = parseISODate(week.end)
  if (start.getMonth() === end.getMonth()) return `${monthDay.format(start)}–${end.getDate()}`
  return `${monthDay.format(start)} – ${monthDay.format(end)}`
}

export function weekContaining(date: Date): Week {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const offset = (start.getDay() - WEEK_STARTS_ON + 7) % 7
  start.setDate(start.getDate() - offset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { start: toISODate(start), end: toISODate(end) }
}

export function previousWeek(week: Week): Week {
  const start = parseISODate(week.start)
  start.setDate(start.getDate() - 7)
  return weekContaining(start)
}
