import type { Branch } from '../types'
import { formatOpeningHours, getOpenStatus, isOpenAllDay, minutesSinceMidnightInSouthAfrica } from './hours'

function branch(overrides: Partial<Branch> = {}): Branch {
  return {
    id: 'test',
    name: 'Test',
    type: 'branch',
    services: ['Branch'],
    address: 'Test Street',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

/** South Africa is UTC+2 all year, so 10:00 SAST is 08:00 UTC. */
const sast = (hours: number, minutes = 0) => new Date(Date.UTC(2026, 9, 14, hours - 2, minutes))

describe('minutesSinceMidnightInSouthAfrica', () => {
  it('uses South African time, not the machine time zone', () => {
    expect(minutesSinceMidnightInSouthAfrica(new Date('2026-10-14T08:30:00Z'))).toBe(10 * 60 + 30)
  })

  it('wraps past midnight', () => {
    expect(minutesSinceMidnightInSouthAfrica(new Date('2026-10-14T22:15:00Z'))).toBe(15)
  })
})

describe('getOpenStatus', () => {
  it('is open during opening hours and says when it closes', () => {
    expect(getOpenStatus(branch(), sast(10))).toEqual({ kind: 'open', label: 'Open until 17:00' })
  })

  it('warns when closing within the hour', () => {
    expect(getOpenStatus(branch(), sast(16, 30))).toEqual({
      kind: 'closing-soon',
      label: 'Closing soon, closes at 17:00',
    })
  })

  it('opens exactly at opening time', () => {
    expect(getOpenStatus(branch(), sast(8)).kind).toBe('open')
  })

  it('is closed exactly at closing time', () => {
    expect(getOpenStatus(branch(), sast(17))).toEqual({
      kind: 'closed',
      label: 'Closed, opens tomorrow at 08:00',
    })
  })

  it('is closed before opening and says when it opens today', () => {
    expect(getOpenStatus(branch(), sast(6))).toEqual({ kind: 'closed', label: 'Closed, opens at 08:00' })
  })

  it('treats 00:00 to 24:00 as open 24 hours at any time', () => {
    const always = branch({ type: 'atm', hours: { open: '00:00', close: '24:00' } })
    expect(getOpenStatus(always, sast(3))).toEqual({ kind: 'open', label: 'Open 24 hours' })
    expect(getOpenStatus(always, sast(23, 59)).kind).toBe('open')
  })

  it('reports unavailable hours instead of guessing', () => {
    expect(getOpenStatus(branch({ hours: null }), sast(10))).toEqual({
      kind: 'no-hours',
      label: 'Opening hours not available',
    })
  })

  it('reports temporarily closed sites regardless of the time', () => {
    expect(getOpenStatus(branch({ status: 'temporarily-closed' }), sast(10))).toEqual({
      kind: 'temporarily-closed',
      label: 'Temporarily closed',
    })
  })

  it('reports permanently closed sites regardless of the time', () => {
    expect(getOpenStatus(branch({ status: 'permanently-closed' }), sast(10))).toEqual({
      kind: 'permanently-closed',
      label: 'Permanently closed',
    })
  })
})

describe('formatOpeningHours', () => {
  it('shows the open and close times', () => {
    expect(formatOpeningHours(branch())).toBe('08:00 to 17:00')
  })

  it('says open 24 hours for around-the-clock sites', () => {
    expect(formatOpeningHours(branch({ hours: { open: '00:00', close: '24:00' } }))).toBe('Open 24 hours')
  })

  it('says so when hours are not available', () => {
    expect(formatOpeningHours(branch({ hours: null }))).toBe('Not available')
  })
})

describe('isOpenAllDay', () => {
  const always = { open: '00:00', close: '24:00' }

  it('is true for a place open from midnight to midnight', () => {
    expect(isOpenAllDay(branch({ hours: always }))).toBe(true)
  })

  it('is false for ordinary hours, for no hours, and for a site that is closed', () => {
    expect(isOpenAllDay(branch({ hours: { open: '08:00', close: '17:00' } }))).toBe(false)
    expect(isOpenAllDay(branch({ hours: null }))).toBe(false)
    expect(isOpenAllDay(branch({ hours: always, status: 'temporarily-closed' }))).toBe(false)
  })
})
