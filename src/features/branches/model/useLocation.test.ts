import { act, renderHook, waitFor } from '@testing-library/react'
import { useLocation } from './useLocation'

type Success = (position: GeolocationPosition) => void
type Failure = (error: GeolocationPositionError) => void

const getCurrentPosition = vi.fn<(success: Success, failure: Failure, options?: PositionOptions) => void>()

function stubGeolocation(value: unknown) {
  Object.defineProperty(navigator, 'geolocation', { value, configurable: true })
}

const position = (lat: number, lng: number) => ({ coords: { latitude: lat, longitude: lng } }) as GeolocationPosition
const failure = (code: number) => ({ code, message: 'nope' }) as GeolocationPositionError

/** The success and failure callbacks the hook passed to the browser on its latest request. */
const lastRequest = () => {
  const [success, fail, options] = getCurrentPosition.mock.lastCall!
  return { success, fail, options }
}

describe('useLocation', () => {
  beforeEach(() => {
    getCurrentPosition.mockReset()
    stubGeolocation({ getCurrentPosition })
  })

  afterEach(() => stubGeolocation(undefined))

  it('starts idle and does not ask the browser for anything', () => {
    const { result } = renderHook(() => useLocation())

    expect(result.current.status).toBe('idle')
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('shows locating while it waits, then the position', () => {
    const { result } = renderHook(() => useLocation())

    act(() => result.current.request())
    expect(result.current.status).toBe('locating')

    act(() => lastRequest().success(position(-26.2, 28.05)))
    expect(result.current).toMatchObject({ status: 'located', position: { lat: -26.2, lng: 28.05 } })
  })

  it('asks for a coarse, cached position that is good enough for sorting by distance', () => {
    const { result } = renderHook(() => useLocation())

    act(() => result.current.request())

    expect(lastRequest().options).toMatchObject({ enableHighAccuracy: false })
    expect(lastRequest().options?.timeout).toBeGreaterThan(0)
    expect(lastRequest().options?.maximumAge).toBeGreaterThan(0)
  })

  it('reports a refusal as denied', () => {
    const { result } = renderHook(() => useLocation())
    act(() => result.current.request())

    act(() => lastRequest().fail(failure(1)))

    expect(result.current.status).toBe('denied')
  })

  it.each([
    [2, 'the position being unavailable'],
    [3, 'a timeout'],
  ])('reports %s (%s) as failed, which is not a refusal', (code) => {
    const { result } = renderHook(() => useLocation())
    act(() => result.current.request())

    act(() => lastRequest().fail(failure(code)))

    expect(result.current.status).toBe('failed')
  })

  it('reports a browser without geolocation as unavailable, without trying', () => {
    stubGeolocation(undefined)
    const { result } = renderHook(() => useLocation())

    act(() => result.current.request())

    expect(result.current.status).toBe('unavailable')
    expect(getCurrentPosition).not.toHaveBeenCalled()
  })

  it('can try again after a failure', () => {
    const { result } = renderHook(() => useLocation())
    act(() => result.current.request())
    act(() => lastRequest().fail(failure(3)))

    act(() => result.current.request())

    expect(result.current.status).toBe('locating')
    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
  })

  it('goes back to idle when cleared', () => {
    const { result } = renderHook(() => useLocation())
    act(() => result.current.request())
    act(() => lastRequest().success(position(-26.2, 28.05)))

    act(() => result.current.clear())

    expect(result.current.status).toBe('idle')
  })

  it('ignores an answer that arrives after the user cleared', () => {
    const { result } = renderHook(() => useLocation())
    act(() => result.current.request())
    const late = lastRequest()

    act(() => result.current.clear())
    act(() => late.success(position(-26.2, 28.05)))

    expect(result.current.status).toBe('idle')
  })

  it('ignores an answer that arrives after unmount', () => {
    const { result, unmount } = renderHook(() => useLocation())
    act(() => result.current.request())
    const late = lastRequest()

    unmount()

    expect(() => late.success(position(-26.2, 28.05))).not.toThrow()
  })
})

/** A stand-in for the browser's record of the user's decision, which tests can change. */
function stubPermission(initial: PermissionState) {
  const listeners = new Set<() => void>()
  const status = {
    state: initial,
    addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
  }
  const query = vi.fn().mockResolvedValue(status)
  Object.defineProperty(navigator, 'permissions', { value: { query }, configurable: true })
  return {
    query,
    listeners,
    change(state: PermissionState) {
      status.state = state
      listeners.forEach((listener) => listener())
    },
  }
}

describe('useLocation after a refusal', () => {
  beforeEach(() => {
    getCurrentPosition.mockReset()
    stubGeolocation({ getCurrentPosition })
  })

  afterEach(() => {
    stubGeolocation(undefined)
    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true })
  })

  async function refuse() {
    const hook = renderHook(() => useLocation())
    act(() => hook.result.current.request())
    await act(async () => lastRequest().fail(failure(1)))
    return hook
  }

  it('is not blocked when the browser will still ask, so asking again opens its prompt', async () => {
    stubPermission('prompt')

    const { result } = await refuse()

    expect(result.current).toMatchObject({ status: 'denied' })
    expect((result.current as { blocked?: boolean }).blocked).toBeFalsy()
  })

  it('is blocked when the browser has said no for good, so only its settings help', async () => {
    stubPermission('denied')

    const { result } = await refuse()

    await waitFor(() => expect(result.current).toMatchObject({ status: 'denied', blocked: true }))
  })

  it('is not blocked, and does not break, where the browser cannot say', async () => {
    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true })

    const { result } = await refuse()

    expect(result.current.status).toBe('denied')
    expect((result.current as { blocked?: boolean }).blocked).toBeFalsy()
  })

  it('does not break when reading the decision throws', async () => {
    Object.defineProperty(navigator, 'permissions', {
      value: { query: vi.fn().mockRejectedValue(new Error('nope')) },
      configurable: true,
    })

    const { result } = await refuse()

    expect(result.current.status).toBe('denied')
  })

  it('looks for the user again by itself when they allow location in the browser settings', async () => {
    const permission = stubPermission('denied')
    const { result } = await refuse()
    await waitFor(() => expect(permission.listeners.size).toBe(1))
    expect(getCurrentPosition).toHaveBeenCalledTimes(1)

    act(() => permission.change('granted'))

    expect(getCurrentPosition).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('locating')
    act(() => lastRequest().success(position(-26.2, 28.05)))
    expect(result.current.status).toBe('located')
  })

  it('does not look again while the site is still blocked', async () => {
    const permission = stubPermission('denied')
    await refuse()
    await waitFor(() => expect(permission.listeners.size).toBe(1))

    act(() => permission.change('denied'))

    expect(getCurrentPosition).toHaveBeenCalledTimes(1)
  })

  it('stops watching once it is looking again, or is removed', async () => {
    const permission = stubPermission('denied')
    const { unmount } = await refuse()
    await waitFor(() => expect(permission.listeners.size).toBe(1))

    unmount()

    expect(permission.listeners.size).toBe(0)
  })
})

describe('useLocation while the position is due', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    getCurrentPosition.mockReset()
    stubGeolocation({ getCurrentPosition })
  })

  afterEach(() => {
    vi.useRealTimers()
    stubGeolocation(undefined)
    Object.defineProperty(navigator, 'permissions', { value: undefined, configurable: true })
  })

  async function request() {
    const hook = renderHook(() => useLocation())
    await act(async () => hook.result.current.request())
    return hook
  }

  it('is awaiting the fix when the browser has already allowed location, until it arrives', async () => {
    stubPermission('granted')
    const { result } = await request()
    expect(result.current.awaitingFix).toBe(true)

    act(() => lastRequest().success(position(-26.2, 28.05)))

    expect(result.current.awaitingFix).toBe(false)
  })

  it('stops waiting after a short while, so a slow fix cannot hold the list for long', async () => {
    stubPermission('granted')
    const { result } = await request()

    act(() => vi.advanceTimersByTime(2500))

    expect(result.current.status).toBe('locating')
    expect(result.current.awaitingFix).toBe(false)
  })

  it.each(['prompt', 'denied'] as const)('does not wait when the permission is %s', async (state) => {
    stubPermission(state)
    const { result } = await request()

    expect(result.current.status).toBe('locating')
    expect(result.current.awaitingFix).toBe(false)
  })

  it('does not wait where the browser cannot say what was decided', async () => {
    const { result } = await request()

    expect(result.current.awaitingFix).toBe(false)
  })
})
