import type { Branch } from '@/features/branches/types'
import { isPlaceName, localityOf, townOf } from './place'

function at(address: string, province: Branch['province'] = 'Gauteng'): Branch {
  return {
    id: 'x',
    name: 'Capitec Bank X',
    type: 'branch',
    services: ['Branch'],
    address,
    province,
    postalCode: '2000',
    phone: null,
    location: { lat: 0, lng: 0 },
    status: 'open',
    hours: null,
  }
}

describe('isPlaceName', () => {
  it.each(['Sandton', 'Cape Town', 'Hyde Park', 'Lone Hill'])('accepts %s', (name) => {
    expect(isPlaceName(name)).toBe(true)
  })

  it.each(['Rivonia Road', 'Fourways Crossing', 'Shop G35', '12 Main Street', 'Sandton City Mall', '', undefined])(
    'rejects %s',
    (name) => {
      expect(isPlaceName(name)).toBe(false)
    },
  )
})

describe('townOf', () => {
  it('is the segment before the province', () => {
    expect(townOf(at('Sandton City, Rivonia Road, Sandton, Gauteng, 2196'))).toBe('Sandton')
  })

  it('falls back to the province when the address has nothing before it', () => {
    expect(townOf(at('Gauteng, 2196'))).toBe('Gauteng')
  })
})

describe('localityOf', () => {
  it('is the suburb when the address has one, which is more local than the town', () => {
    expect(localityOf(at('Yarona Mall, Watt Avenue, Wynberg, Sandton, Gauteng, 2090'))).toBe('Wynberg')
  })

  it('is the town when the segment before it is a street or a centre', () => {
    expect(localityOf(at('Station Drive, Durban, KwaZulu-Natal, 4001', 'KwaZulu-Natal'))).toBe('Durban')
  })

  it('is the town when there is only a town', () => {
    expect(localityOf(at('Lady Grey Street, Paarl, Western Cape, 7646', 'Western Cape'))).toBe('Paarl')
  })
})
