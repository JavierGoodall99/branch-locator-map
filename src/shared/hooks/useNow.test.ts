import { act, renderHook } from '@testing-library/react'
import { useNow } from './useNow'

describe('useNow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-14T08:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('returns the current time', () => {
    const { result } = renderHook(() => useNow())

    expect(result.current.toISOString()).toBe('2026-10-14T08:00:00.000Z')
  })

  it('updates after each interval', () => {
    const { result } = renderHook(() => useNow(60_000))

    act(() => vi.advanceTimersByTime(60_000))

    expect(result.current.toISOString()).toBe('2026-10-14T08:01:00.000Z')
  })

  it('stops updating after unmount', () => {
    const { unmount } = renderHook(() => useNow(1000))
    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
