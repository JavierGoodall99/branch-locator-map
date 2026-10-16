import { type LocatorFilters, DEFAULT_FILTERS, RADIUS_OPTIONS, clearFilters, countWindowFilters, hasActiveFilters, hasChosenFilters, toBranchFilters } from './filters'

describe('DEFAULT_FILTERS', () => {
  it('starts on branches with no search', () => {
    expect(DEFAULT_FILTERS).toEqual({
      query: '',
      show: 'branches',
      radiusKm: null,
      openNow: false,
      province: null,
      services: [],
    })
  })
})

describe('toBranchFilters', () => {
  it('shows branches and business centres for "branches"', () => {
    expect(toBranchFilters({ ...DEFAULT_FILTERS, show: 'branches' }).types).toEqual(['branch', 'business-centre'])
  })

  it('shows only ATMs for "atms"', () => {
    expect(toBranchFilters({ ...DEFAULT_FILTERS, show: 'atms' }).types).toEqual(['atm'])
  })

  it('applies no type filter for "both"', () => {
    expect(toBranchFilters({ ...DEFAULT_FILTERS, show: 'both' }).types).toEqual([])
  })

  it('passes the query through', () => {
    expect(toBranchFilters({ ...DEFAULT_FILTERS, query: 'sandton', show: 'both' })).toMatchObject({
      query: 'sandton',
      types: [],
    })
  })

  it('passes open now, the province and the services through', () => {
    expect(
      toBranchFilters({ ...DEFAULT_FILTERS, openNow: true, province: 'Gauteng', services: ['SmartID Services'] }),
    ).toMatchObject({ openNow: true, province: 'Gauteng', services: ['SmartID Services'] })
  })

  it('leaves the province out when there is none', () => {
    expect(toBranchFilters(DEFAULT_FILTERS).province).toBeUndefined()
  })
})

describe('hasActiveFilters', () => {
  it('is false for the defaults', () => {
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(false)
  })

  it('ignores the show switch, because it is a view choice and not a filter', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, show: 'atms' })).toBe(false)
  })

  it('ignores a query that is only whitespace', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: '   ' })).toBe(false)
  })

  it('is true with a query', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, query: 'paarl' })).toBe(true)
  })

  it('is true with anything chosen in the Filters window', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, openNow: true })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, province: 'Gauteng' })).toBe(true)
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, services: ['SmartID Services'] })).toBe(true)
  })

  it('is true with a distance', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, radiusKm: 10 })).toBe(true)
  })
})

describe('hasChosenFilters', () => {
  it('ignores the search, which has its own box', () => {
    expect(hasChosenFilters({ ...DEFAULT_FILTERS, query: 'paarl' })).toBe(false)
  })

  it('is true for a distance, or anything in the Filters window', () => {
    expect(hasChosenFilters({ ...DEFAULT_FILTERS, radiusKm: 5 })).toBe(true)
    expect(hasChosenFilters({ ...DEFAULT_FILTERS, openNow: true })).toBe(true)
  })
})

describe('clearFilters', () => {
  it('clears the search, the distance and the Filters window but keeps what is being shown', () => {
    const everything = {
      query: 'paarl',
      show: 'atms' as const,
      radiusKm: 25,
      openNow: true,
      province: 'Gauteng' as const,
      services: ['SmartID Services'],
    }

    expect(clearFilters(everything)).toEqual({ ...DEFAULT_FILTERS, show: 'atms' })
  })
})

describe('countWindowFilters', () => {
  it('is zero for the defaults', () => {
    expect(countWindowFilters(DEFAULT_FILTERS)).toBe(0)
  })

  it('counts open now, a province, and each service', () => {
    expect(countWindowFilters({ openNow: true, province: null, services: [] })).toBe(1)
    expect(countWindowFilters({ openNow: false, province: 'Gauteng', services: [] })).toBe(1)
    expect(countWindowFilters({ openNow: true, province: 'Gauteng', services: ['A', 'B'] })).toBe(4)
  })

  it('does not count the search, the show switch or the distance, which are outside the window', () => {
    const outside: LocatorFilters = { ...DEFAULT_FILTERS, query: 'paarl', show: 'both', radiusKm: 10 }

    expect(countWindowFilters(outside)).toBe(0)
  })
})

describe('RADIUS_OPTIONS', () => {
  it('goes from near to far', () => {
    expect([...RADIUS_OPTIONS]).toEqual([5, 10, 25, 50, 100])
  })
})
