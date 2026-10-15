import type { Branch } from '../types'
import { formatDistance, haversineKm, withDistanceFrom } from './distance'

const johannesburg = { lat: -26.2041, lng: 28.0473 }
const capeTown = { lat: -33.9249, lng: 18.4241 }

function branch(id: string, lat: number, lng: number): Branch {
  return {
    id,
    name: id,
    type: 'branch',
    services: ['Branch'],
    address: 'Test Street',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat, lng },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
  }
}

describe('haversineKm', () => {
  it('is zero for identical points', () => {
    expect(haversineKm(johannesburg, johannesburg)).toBe(0)
  })

  it('measures Johannesburg to Cape Town at about 1,262 km', () => {
    expect(haversineKm(johannesburg, capeTown)).toBeCloseTo(1262, -1)
  })

  it('is symmetric', () => {
    expect(haversineKm(johannesburg, capeTown)).toBeCloseTo(haversineKm(capeTown, johannesburg), 6)
  })

  it('measures one degree of latitude at about 111 km', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.2, 0)
  })

  it('handles points either side of the antimeridian', () => {
    expect(haversineKm({ lat: 0, lng: 179.5 }, { lat: 0, lng: -179.5 })).toBeCloseTo(111.2, 0)
  })
})

describe('withDistanceFrom', () => {
  it('adds distanceKm and sorts nearest first', () => {
    const far = branch('far', -33.9249, 18.4241)
    const near = branch('near', -26.2, 28.05)
    const result = withDistanceFrom([far, near], johannesburg)

    expect(result.map((item) => item.id)).toEqual(['near', 'far'])
    expect(result[0].distanceKm).toBeLessThan(result[1].distanceKm)
  })

  it('breaks ties by name so the order is stable', () => {
    const b = branch('b', -26.2, 28.05)
    const a = branch('a', -26.2, 28.05)
    expect(withDistanceFrom([b, a], johannesburg).map((item) => item.id)).toEqual(['a', 'b'])
  })

  it('does not mutate the input', () => {
    const input = [branch('x', -26.2, 28.05)]
    withDistanceFrom(input, johannesburg)
    expect(input[0]).not.toHaveProperty('distanceKm')
  })
})

describe('formatDistance', () => {
  it.each([
    [0.4, '400 m'],
    [0.437, '440 m'],
    [0.05, '50 m'],
    [0.996, '1,0 km'],
    [1, '1,0 km'],
    [2.34, '2,3 km'],
    [9.96, '10 km'],
    [47.4, '47 km'],
    [47.6, '48 km'],
  ])('shows %s km as %s', (km, expected) => {
    expect(formatDistance(km)).toBe(expected)
  })
})
