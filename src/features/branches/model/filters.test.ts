import { DEFAULT_FILTERS, clearFilters, hasActiveFilters, toBranchFilters } from './filters'

describe('DEFAULT_FILTERS', () => {
  it('starts on branches with no search', () => {
    expect(DEFAULT_FILTERS).toEqual({ query: '', show: 'branches' })
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
    expect(toBranchFilters({ query: 'sandton', show: 'both' })).toEqual({ query: 'sandton', types: [] })
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
})

describe('clearFilters', () => {
  it('clears the search but keeps what is being shown', () => {
    expect(clearFilters({ query: 'paarl', show: 'atms' })).toEqual({ query: '', show: 'atms' })
  })
})
