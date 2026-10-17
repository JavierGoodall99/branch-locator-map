import type { Branch } from '../types'
import { filterBranches } from './filter'

function branch(overrides: Partial<Branch> & { id: string }): Branch {
  return {
    name: overrides.id,
    type: 'branch',
    services: ['Branch'],
    address: '1 Test Street, Testville',
    province: 'Gauteng',
    postalCode: '2000',
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

const sandton = branch({
  id: 'sandton',
  name: 'Capitec Bank Sandton City',
  address: 'Sandton City, Rivonia Road, Sandton',
  postalCode: '2196',
})
const durbanAtm = branch({
  id: 'durban',
  name: 'Capitec Bank ATM Durban Station',
  type: 'atm',
  services: ['ATM'],
  province: 'KwaZulu-Natal',
  address: 'Station Drive, Durban',
  postalCode: '4001',
})
const paarl = branch({
  id: 'paarl',
  name: 'Capitec Bank Paarl',
  province: 'Western Cape',
  address: 'Lady Grey Street, Paarl',
  postalCode: '7646',
  hours: { open: '09:00', close: '16:00' },
})
const closedTemporarily = branch({ id: 'temp', name: 'Capitec Bank Temp', status: 'temporarily-closed' })
const closedForGood = branch({ id: 'gone', name: 'Capitec Bank Gone', status: 'permanently-closed' })
const all = [sandton, durbanAtm, paarl, closedTemporarily, closedForGood]

/** 10:00 in South Africa (UTC+2). */
const morning = new Date('2026-10-14T08:00:00Z')
/** 20:00 in South Africa. */
const evening = new Date('2026-10-14T18:00:00Z')

const ids = (items: Branch[]) => items.map((item) => item.id)

describe('filterBranches', () => {
  it('returns everything except permanently closed sites when no filters are set', () => {
    expect(ids(filterBranches(all, {}, morning))).toEqual(['sandton', 'durban', 'paarl', 'temp'])
  })

  it('searches the name, ignoring case', () => {
    expect(ids(filterBranches(all, { query: 'SANDTON' }, morning))).toEqual(['sandton'])
  })

  it('searches the address, province and postal code', () => {
    expect(ids(filterBranches(all, { query: 'rivonia' }, morning))).toEqual(['sandton'])
    expect(ids(filterBranches(all, { query: 'kwazulu' }, morning))).toEqual(['durban'])
    expect(ids(filterBranches(all, { query: '7646' }, morning))).toEqual(['paarl'])
  })

  it('requires every word to match', () => {
    expect(ids(filterBranches(all, { query: 'capitec durban' }, morning))).toEqual(['durban'])
    expect(ids(filterBranches(all, { query: 'durban paarl' }, morning))).toEqual([])
  })

  it('ignores accents and surrounding whitespace', () => {
    const accented = branch({ id: 'cafe', name: 'Capitec Café Plaza' })
    expect(ids(filterBranches([accented], { query: '  cafe ' }, morning))).toEqual(['cafe'])
  })

  it('filters by type, and treats an empty list as all types', () => {
    expect(ids(filterBranches(all, { types: ['atm'] }, morning))).toEqual(['durban'])
    expect(ids(filterBranches(all, { types: [] }, morning))).toHaveLength(4)
  })

  it('keeps only places that offer one of the chosen services', () => {
    const smart = branch({ id: 'smart', services: ['Branch', 'SmartID Services'] })
    const cash = branch({ id: 'cash', type: 'atm', services: ['ATM', 'Cash Accepting ATM'] })
    const plain = branch({ id: 'plain', services: ['Branch'] })
    const list = [smart, cash, plain]

    expect(ids(filterBranches(list, { services: ['SmartID Services'] }, morning))).toEqual(['smart'])
    expect(ids(filterBranches(list, { services: ['SmartID Services', 'Cash Accepting ATM'] }, morning))).toEqual([
      'smart',
      'cash',
    ])
    expect(ids(filterBranches(list, { services: [] }, morning))).toEqual(['smart', 'cash', 'plain'])
  })

  it('keeps only places open around the clock, and not a closed one that has those hours', () => {
    const always = branch({ id: 'always', type: 'atm', hours: { open: '00:00', close: '24:00' } })
    const closed = branch({ id: 'closed', status: 'temporarily-closed', hours: { open: '00:00', close: '24:00' } })
    const noHours = branch({ id: 'none', hours: null })
    const office = branch({ id: 'office' })

    expect(ids(filterBranches([always, closed, noHours, office], { open24Hours: true }, morning))).toEqual(['always'])
    expect(ids(filterBranches([always, office], { open24Hours: true }, evening))).toEqual(['always'])
  })

  it('filters by province', () => {
    expect(ids(filterBranches(all, { province: 'Western Cape' }, morning))).toEqual(['paarl'])
  })

  it('keeps only sites that are open now when asked', () => {
    expect(ids(filterBranches(all, { openNow: true }, morning))).toEqual(['sandton', 'durban', 'paarl'])
    expect(ids(filterBranches(all, { openNow: true }, evening))).toEqual([])
  })

  it('combines filters', () => {
    expect(ids(filterBranches(all, { query: 'capitec', types: ['branch'], openNow: true }, morning))).toEqual([
      'sandton',
      'paarl',
    ])
  })

  it('does not mutate the input', () => {
    const input = [...all]
    filterBranches(input, { query: 'sandton' }, morning)
    expect(input).toEqual(all)
  })
})
