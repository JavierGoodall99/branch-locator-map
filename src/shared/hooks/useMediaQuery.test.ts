import { act, renderHook } from '@testing-library/react'
import { useMediaQuery } from './useMediaQuery'

function stubMatchMedia(initial: boolean) {
  let matches = initial
  const listeners = new Set<() => void>()
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return matches
      },
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
    })),
  )
  return {
    change(next: boolean) {
      matches = next
      listeners.forEach((listener) => listener())
    },
    listeners,
  }
}

describe('useMediaQuery', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('is false where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(renderHook(() => useMediaQuery('(min-width: 768px)')).result.current).toBe(false)
  })

  it('reads whether the query matches now', () => {
    stubMatchMedia(true)

    expect(renderHook(() => useMediaQuery('(min-width: 768px)')).result.current).toBe(true)
  })

  it('updates when the window crosses the breakpoint', () => {
    const media = stubMatchMedia(false)
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(result.current).toBe(false)

    act(() => media.change(true))

    expect(result.current).toBe(true)
  })

  it('stops listening when it is removed', () => {
    const media = stubMatchMedia(false)
    const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    expect(media.listeners.size).toBe(1)

    unmount()

    expect(media.listeners.size).toBe(0)
  })
})
