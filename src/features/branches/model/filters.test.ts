import {
  type LocatorFilters,
  DEFAULT_FILTERS,
  RADIUS_OPTIONS,
  clearFilters,
  countWindowFilters,
  hasActiveFilters,
  hasChosenFilters,
  toBranchFilters,
} from './filters'

/** The defaults with no distance, which is how the page sees them until the location is known. */
const QUIET: LocatorFilters = { ...DEFAULT_FILTERS, radiusKm: null }

describe('DEFAULT_FILTERS', () => {
  it('starts on both branches and ATMs, within 25 km, nearest first, with no search', () => {
    expect(DEFAULT_FILTERS).toEqual({
      query: '',
      show: 'both',
      radiusKm: 25,
      openNow: false,
      open24Hours: false,
      province: null,
      services: [],
      sort: 'distance',
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
    expect(toBranchFilters({ ...DEFAULT_FILTERS, query: 'sandton' })).toMatchObject({ query: 'sandton', types: [] })
  })

  it('passes open now, open 24 hours, the province and the services through', () => {
    expect(
      toBranchFilters({
        ...DEFAULT_FILTERS,
        openNow: true,
        open24Hours: true,
        province: 'Gauteng',
        services: ['SmartID Services'],
      }),
    ).toMatchObject({ openNow: true, open24Hours: true, province: 'Gauteng', services: ['SmartID Services'] })
  })

  it('leaves the province out when there is none', () => {
    expect(toBranchFilters(DEFAULT_FILTERS).province).toBeUndefined()
  })
})

describe('hasActiveFilters', () => {
  it('is false for the defaults while the distance is not in effect', () => {
    expect(hasActiveFilters(QUIET)).toBe(false)
  })

  it('ignores the show switch and the sort order, which are view choices and not filters', () => {
    expect(hasActiveFilters({ ...QUIET, show: 'atms', sort: 'name' })).toBe(false)
  })

  it('ignores a query that is only whitespace', () => {
    expect(hasActiveFilters({ ...QUIET, query: '   ' })).toBe(false)
  })

  it('is true with a query', () => {
    expect(hasActiveFilters({ ...QUIET, query: 'paarl' })).toBe(true)
  })

  it('is true with anything chosen in the Filters window', () => {
    expect(hasActiveFilters({ ...QUIET, openNow: true })).toBe(true)
    expect(hasActiveFilters({ ...QUIET, open24Hours: true })).toBe(true)
    expect(hasActiveFilters({ ...QUIET, province: 'Gauteng' })).toBe(true)
    expect(hasActiveFilters({ ...QUIET, services: ['SmartID Services'] })).toBe(true)
  })

  it('is true with a distance, which is how the 25 km that comes with the location counts', () => {
    expect(hasActiveFilters({ ...QUIET, radiusKm: 10 })).toBe(true)
    expect(hasActiveFilters(DEFAULT_FILTERS)).toBe(true)
  })
})

describe('hasChosenFilters', () => {
  it('ignores the search, which has its own box', () => {
    expect(hasChosenFilters({ ...QUIET, query: 'paarl' })).toBe(false)
  })

  it('is true for a distance, or anything in the Filters window', () => {
    expect(hasChosenFilters({ ...QUIET, radiusKm: 5 })).toBe(true)
    expect(hasChosenFilters({ ...QUIET, openNow: true })).toBe(true)
  })
})

describe('clearFilters', () => {
  it('clears the search, the distance and the Filters window but keeps what is being shown', () => {
    const everything: LocatorFilters = {
      query: 'paarl',
      show: 'atms',
      radiusKm: 10,
      openNow: true,
      open24Hours: true,
      province: 'Gauteng',
      services: ['SmartID Services'],
      sort: 'name',
    }

    expect(clearFilters(everything)).toEqual({ ...DEFAULT_FILTERS, radiusKm: null, show: 'atms' })
  })

  it('goes to any distance, not back to 25 km, so clearing really shows everything', () => {
    expect(clearFilters(DEFAULT_FILTERS).radiusKm).toBeNull()
  })
})

describe('countWindowFilters', () => {
  const none = { openNow: false, open24Hours: false, province: null, services: [] }

  it('is zero for the defaults', () => {
    expect(countWindowFilters(DEFAULT_FILTERS)).toBe(0)
  })

  it('counts open now, open 24 hours, a province, and each service', () => {
    expect(countWindowFilters({ ...none, openNow: true })).toBe(1)
    expect(countWindowFilters({ ...none, open24Hours: true })).toBe(1)
    expect(countWindowFilters({ ...none, province: 'Gauteng' })).toBe(1)
    expect(countWindowFilters({ openNow: true, open24Hours: true, province: 'Gauteng', services: ['A', 'B'] })).toBe(5)
  })

  it('does not count the search, the show switch, the distance or the sort order', () => {
    const outside: LocatorFilters = { ...DEFAULT_FILTERS, query: 'paarl', show: 'atms', radiusKm: 10, sort: 'name' }

    expect(countWindowFilters(outside)).toBe(0)
  })
})

describe('RADIUS_OPTIONS', () => {
  it('goes from near to far', () => {
    expect([...RADIUS_OPTIONS]).toEqual([5, 10, 25, 50, 100])
  })
})
