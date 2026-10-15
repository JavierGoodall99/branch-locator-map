import type { Branch } from '../types'
import { SOUTH_AFRICA_BOUNDS, boundsFor, idsKey, toFeatureCollection } from './geo'

function branch(id: string, lat: number, lng: number, overrides: Partial<Branch> = {}): Branch {
  return {
    id,
    name: `Capitec ${id}`,
    type: 'branch',
    services: ['Branch'],
    address: '1 Test Street',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat, lng },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

describe('toFeatureCollection', () => {
  it('makes one point per branch, with longitude first as GeoJSON requires', () => {
    const result = toFeatureCollection([branch('a', -26.2, 28.05)])

    expect(result.type).toBe('FeatureCollection')
    expect(result.features).toEqual([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [28.05, -26.2] },
        properties: { id: 'a', name: 'Capitec a', type: 'branch' },
      },
    ])
  })

  it('keeps the branch type so ATMs and branches can be styled differently', () => {
    const result = toFeatureCollection([branch('a', 0, 0), branch('b', 0, 0, { type: 'atm' })])

    expect(result.features.map((feature) => feature.properties.type)).toEqual(['branch', 'atm'])
  })

  it('is empty for no branches', () => {
    expect(toFeatureCollection([]).features).toEqual([])
  })
})

describe('boundsFor', () => {
  it('returns null when there is nothing to show', () => {
    expect(boundsFor([])).toBeNull()
  })

  it('wraps every branch, as [[west, south], [east, north]]', () => {
    const result = boundsFor([branch('a', -26.2, 28.05), branch('b', -33.9, 18.4), branch('c', -29.8, 31.0)])

    expect(result).toEqual([
      [18.4, -33.9],
      [31.0, -26.2],
    ])
  })

  it('gives a single branch a zero-size box', () => {
    expect(boundsFor([branch('a', -26.2, 28.05)])).toEqual([
      [28.05, -26.2],
      [28.05, -26.2],
    ])
  })
})

describe('idsKey', () => {
  it('is the same for the same branches however the array was built', () => {
    const first = [branch('a', 0, 0), branch('b', 0, 0)]
    const second = [branch('a', 0, 0), branch('b', 0, 0)]

    expect(idsKey(first)).toBe(idsKey(second))
  })

  it('changes when the set of branches changes', () => {
    expect(idsKey([branch('a', 0, 0)])).not.toBe(idsKey([branch('a', 0, 0), branch('b', 0, 0)]))
  })
})

describe('SOUTH_AFRICA_BOUNDS', () => {
  it('covers the country from the Western Cape to Limpopo', () => {
    const [[west, south], [east, north]] = SOUTH_AFRICA_BOUNDS

    expect(west).toBeLessThan(18)
    expect(east).toBeGreaterThan(32)
    expect(south).toBeLessThan(-34)
    expect(north).toBeGreaterThan(-23)
  })
})
