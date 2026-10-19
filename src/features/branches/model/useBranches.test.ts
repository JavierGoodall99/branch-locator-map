import { act, renderHook, waitFor } from '@testing-library/react'
import type { Branch } from '@/features/branches/types'
import { useBranches } from './useBranches'

const branch: Branch = {
  id: 'a',
  name: 'Capitec Bank A',
  type: 'branch',
  services: ['Branch'],
  address: '1 Test Street',
  province: 'Gauteng',
  postalCode: '2000',
  phone: null,
  location: { lat: -26.2, lng: 28.05 },
  status: 'open',
  hours: { open: '08:00', close: '17:00' },
}

const ok = () => new Response(JSON.stringify([branch]))

describe('useBranches', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('starts loading, then returns the branches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok()))
    const { result } = renderHook(() => useBranches())

    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(result.current).toMatchObject({ status: 'success', branches: [branch] })
  })

  it('reports the API error message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    const { result } = renderHook(() => useBranches())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({
      status: 'error',
      message: 'Branch service responded with status 500.',
    })
  })

  it('uses a generic message for unexpected errors, without leaking details', async () => {
    const broken = {
      get ok(): boolean {
        throw new Error('boom: internal detail')
      },
    }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(broken))
    const { result } = renderHook(() => useBranches())

    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current).toMatchObject({ message: 'Something went wrong while loading branches.' })
  })

  it('retries after a failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('nope', { status: 503 }))
      .mockResolvedValueOnce(ok())
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useBranches())
    await waitFor(() => expect(result.current.status).toBe('error'))

    act(() => result.current.retry())
    expect(result.current.status).toBe('loading')
    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('aborts the request on unmount', () => {
    let signal: AbortSignal | null | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        signal = init?.signal
        return new Promise(() => {})
      }),
    )
    const { unmount } = renderHook(() => useBranches())
    unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('stays quiet when an aborted request rejects', async () => {
    let rejectFetch: (reason: unknown) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise((_resolve, reject) => (rejectFetch = reject))),
    )
    const { result, unmount } = renderHook(() => useBranches())
    unmount()
    rejectFetch(new DOMException('Aborted', 'AbortError'))
    await Promise.resolve()

    expect(result.current.status).toBe('loading')
  })
})
