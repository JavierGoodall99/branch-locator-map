import type { Branch } from '../types'
import { listBranches } from './listing'

function branch(id: string, name: string, overrides: Partial<Branch> = {}): Branch {
  return {
    id,
    name,
    type: 'branch',
    services: ['Branch'],
    address: '1 Test Street, Gauteng, 2000',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

const now = new Date('2026-10-14T08:00:00Z')

describe('listBranches', () => {
  it('sorts by name', () => {
    const result = listBranches([branch('b', 'Zeta'), branch('a', 'Alpha')], {}, now)

    expect(result.map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('applies the filters and drops permanently closed sites', () => {
    const result = listBranches(
      [
        branch('a', 'Alpha Paarl'),
        branch('b', 'Beta Durban'),
        branch('c', 'Gamma Paarl', { status: 'permanently-closed' }),
      ],
      { query: 'paarl' },
      now,
    )

    expect(result.map((item) => item.id)).toEqual(['a'])
  })

  it('does not reorder or change the input array', () => {
    const input = [branch('b', 'Zeta'), branch('a', 'Alpha')]

    listBranches(input, {}, now)

    expect(input.map((item) => item.id)).toEqual(['b', 'a'])
  })
})
