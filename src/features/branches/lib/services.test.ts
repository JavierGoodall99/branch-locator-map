import type { Branch } from '../types'
import { serviceOptions } from './services'

function branch(id: string, services: string[]): Branch {
  return {
    id,
    name: id,
    type: 'branch',
    services,
    address: '1 Test Street',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: null,
  }
}

describe('serviceOptions', () => {
  it('lists each service once, in alphabetical order', () => {
    const options = serviceOptions([
      branch('a', ['SmartID Services', 'Cash Accepting ATM']),
      branch('b', ['SmartID Services']),
    ])

    expect(options).toEqual(['Cash Accepting ATM', 'SmartID Services'])
  })

  it('leaves out services that only repeat the kind of site, which the Show switch covers', () => {
    expect(serviceOptions([branch('a', ['Branch', 'ATM', 'Business Banking Centre'])])).toEqual([
      'Business Banking Centre',
    ])
  })

  it('has none when there are no branches', () => {
    expect(serviceOptions([])).toEqual([])
  })
})
