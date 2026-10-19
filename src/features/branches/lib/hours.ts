import type { Branch } from '../types'

const TIME_ZONE = 'Africa/Johannesburg'
const CLOSING_SOON_MINUTES = 60
const MINUTES_PER_DAY = 24 * 60

export type OpenStatusKind =
  'open' | 'closing-soon' | 'closed' | 'no-hours' | 'temporarily-closed' | 'permanently-closed'

export interface OpenStatus {
  kind: OpenStatusKind
  label: string
}

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** Minutes since midnight in South Africa, whatever the viewer's own time zone. */
export function minutesSinceMidnightInSouthAfrica(date: Date): number {
  const parts = clock.formatToParts(date)
  const hours = Number(parts.find((part) => part.type === 'hour')?.value)
  const minutes = Number(parts.find((part) => part.type === 'minute')?.value)
  return hours * 60 + minutes
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/** Whether a place is open around the clock, every day. A closed site is not, whatever its hours say. */
export function isOpenAllDay(branch: Branch): boolean {
  if (branch.status !== 'open' || !branch.hours) return false
  return toMinutes(branch.hours.open) === 0 && toMinutes(branch.hours.close) === MINUTES_PER_DAY
}

/** Whether a branch is open at `now`, with a short label that is ready to display. */
export function getOpenStatus(branch: Branch, now: Date): OpenStatus {
  if (branch.status === 'permanently-closed') {
    return { kind: 'permanently-closed', label: 'Permanently closed' }
  }
  if (branch.status === 'temporarily-closed') {
    return { kind: 'temporarily-closed', label: 'Temporarily closed' }
  }
  if (!branch.hours) {
    return { kind: 'no-hours', label: 'Opening hours not available' }
  }

  const { open, close } = branch.hours
  const opens = toMinutes(open)
  const closes = toMinutes(close)

  if (opens === 0 && closes === MINUTES_PER_DAY) {
    return { kind: 'open', label: 'Open 24 hours' }
  }

  const current = minutesSinceMidnightInSouthAfrica(now)

  if (current >= opens && current < closes) {
    if (closes - current <= CLOSING_SOON_MINUTES) {
      return { kind: 'closing-soon', label: `Closing soon, closes at ${close}` }
    }
    return { kind: 'open', label: `Open until ${close}` }
  }

  if (current < opens) {
    return { kind: 'closed', label: `Closed, opens at ${open}` }
  }
  return { kind: 'closed', label: `Closed, opens tomorrow at ${open}` }
}

/** Opening hours as plain text for the detail view, for example "08:00 to 17:00". */
export function formatOpeningHours(branch: Branch): string {
  if (!branch.hours) return 'Not available'
  const { open, close } = branch.hours
  if (toMinutes(open) === 0 && toMinutes(close) === MINUTES_PER_DAY) return 'Open 24 hours'
  return `${open} to ${close}`
}
