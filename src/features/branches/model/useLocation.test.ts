import { act, renderHook } from '@testing-library/react'
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
