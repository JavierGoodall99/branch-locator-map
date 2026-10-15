import { DEFAULT_FILTERS, clearFilters, hasActiveFilters, toBranchFilters } from './filters'

describe('DEFAULT_FILTERS', () => {
  it('starts on branches with nothing else applied', () => {
    expect(DEFAULT_FILTERS).toEqual({ query: '', show: 'branches', openNow: false, province: null })
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

  it('passes the query, open-now flag and province through', () => {
    expect(
      toBranchFilters({ query: 'sandton', show: 'both', openNow: true, province: 'Gauteng' }),
    ).toEqual({ query: 'sandton', types: [], openNow: true, province: 'Gauteng' })
  })

  it('leaves the province unset when none is chosen', () => {
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

  it.each([
    ['a query', { query: 'paarl' }],
    ['open now', { openNow: true }],
    ['a province', { province: 'Western Cape' as const }],
  ])('is true with %s', (_label, change) => {
    expect(hasActiveFilters({ ...DEFAULT_FILTERS, ...change })).toBe(true)
  })
})

describe('clearFilters', () => {
  it('resets the search and filters but keeps what is being shown', () => {
    const active = { query: 'paarl', show: 'atms' as const, openNow: true, province: 'Western Cape' as const }

    expect(clearFilters(active)).toEqual({ ...DEFAULT_FILTERS, show: 'atms' })
  })
})
