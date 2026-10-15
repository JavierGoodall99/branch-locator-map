import sample from '../../../../public/branches.json'
import { BranchesApiError, fetchBranches, parseBranches } from './branchesApi'

const valid = {
  id: 'a',
  name: 'Capitec Bank A',
  type: 'branch',
  services: ['Branch'],
  address: '1 Test Street, Gauteng, 2000',
  province: 'Gauteng',
  postalCode: '2000',
  phone: '+27860102043',
  location: { lat: -26.2, lng: 28.05 },
  status: 'open',
  hours: { open: '08:00', close: '17:00' },
}

describe('parseBranches', () => {
  it('accepts the shipped sample dataset', () => {
    expect(parseBranches(sample)).toHaveLength(sample.length)
  })

  it('accepts a missing phone and missing hours', () => {
    const [result] = parseBranches([{ ...valid, phone: null, hours: null }])
    expect(result.phone).toBeNull()
    expect(result.hours).toBeNull()
  })

  it('rejects a payload that is not an array', () => {
    expect(() => parseBranches({ stores: [] })).toThrow(BranchesApiError)
  })

  it.each([
    ['an unknown type', { ...valid, type: 'kiosk' }],
    ['an unknown status', { ...valid, status: 'sleeping' }],
    ['an unknown province', { ...valid, province: 'Narnia' }],
    ['a non-numeric latitude', { ...valid, location: { lat: '-26.2', lng: 28.05 } }],
    ['a latitude out of range', { ...valid, location: { lat: 95, lng: 28.05 } }],
    ['malformed hours', { ...valid, hours: { open: '8am', close: '17:00' } }],
    ['a missing name', { ...valid, name: undefined }],
    ['non-string services', { ...valid, services: [1] }],
  ])('rejects a record with %s', (_label, record) => {
    expect(() => parseBranches([record])).toThrow(BranchesApiError)
  })

  it('names the offending record in the error', () => {
    expect(() => parseBranches([valid, { ...valid, id: 'bad', type: 'kiosk' }])).toThrow(/index 1/)
  })
})

describe('fetchBranches', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns parsed branches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([valid]))))
    await expect(fetchBranches()).resolves.toEqual([valid])
  })

  it('passes the abort signal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('[]'))
    vi.stubGlobal('fetch', fetchMock)
    const controller = new AbortController()
    await fetchBranches(controller.signal)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('branches.json'), {
      signal: controller.signal,
    })
  })

  it('throws a typed error on an HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('nope', { status: 500 })))
    await expect(fetchBranches()).rejects.toThrow(BranchesApiError)
  })

  it('throws a typed error when the body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>')))
    await expect(fetchBranches()).rejects.toThrow(BranchesApiError)
  })

  it('wraps network failures but lets aborts through untouched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(fetchBranches()).rejects.toThrow(BranchesApiError)

    const abort = new DOMException('Aborted', 'AbortError')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort))
    await expect(fetchBranches()).rejects.toBe(abort)
  })
})
