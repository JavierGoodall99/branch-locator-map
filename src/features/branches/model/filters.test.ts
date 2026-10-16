import { DEFAULT_FILTERS, RADIUS_OPTIONS, clearFilters, countChosenFilters, hasActiveFilters, toBranchFilters } from './filters'

describe('DEFAULT_FILTERS', () => {
  it('starts on branches with no search', () => {
    expect(DEFAULT_FILTERS).toEqual({ query: '', show: 'branches', radiusKm: null })
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
    expect(toBranchFilters({ ...DEFAULT_FILTERS, query: 'sandton', show: 'both' })).toEqual({ query: 'sandton', types: [] })
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

  it('is true with a distance', () => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, radiusKm: 10 })).toBe(true)
  })
})

describe('clearFilters', () => {
  it('clears the search and the distance but keeps what is being shown', () => {
    expect(clearFilters({ query: 'paarl', show: 'atms', radiusKm: 25 })).toEqual({
      query: '',
      show: 'atms',
      radiusKm: null,
    })
  })
})

describe('countChosenFilters', () => {
  it('is zero for the defaults, and ignores the search, which has its own box', () => {
    expect(countChosenFilters(DEFAULT_FILTERS)).toBe(0)
    expect(countChosenFilters({ ...DEFAULT_FILTERS, query: 'paarl' })).toBe(0)
  })

  it('counts what is shown and the distance separately', () => {
    expect(countChosenFilters({ ...DEFAULT_FILTERS, show: 'both' })).toBe(1)
    expect(countChosenFilters({ ...DEFAULT_FILTERS, radiusKm: 5 })).toBe(1)
    expect(countChosenFilters({ query: '', show: 'atms', radiusKm: 5 })).toBe(2)
  })
})

describe('RADIUS_OPTIONS', () => {
  it('goes from near to far', () => {
    expect([...RADIUS_OPTIONS]).toEqual([5, 10, 25, 50, 100])
  })
})
