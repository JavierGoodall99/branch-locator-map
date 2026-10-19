import type { Branch } from '@/features/branches/types'
import { MIN_QUERY_LENGTH, buildPlaceIndex, suggest } from './suggestions'

function branch(id: string, name: string, address: string, overrides: Partial<Branch> = {}): Branch {
  const parts = address.split(', ')
  return {
    id,
    name,
    type: 'branch',
    services: ['Branch'],
    address,
    province: parts.at(-2) as Branch['province'],
    postalCode: parts.at(-1)!,
    phone: null,
    location: { lat: -26.2, lng: 28.05 },
    status: 'open',
    hours: { open: '08:00', close: '17:00' },
    ...overrides,
  }
}

const branches = [
  branch('1', 'Capitec Bank Sandton City', 'Sandton City, Rivonia Road, Sandton, Gauteng, 2196'),
  branch(
    '2',
    'Capitec Bank Fourways Crossing',
    'Shop G35, Fourways Crossing, Twilight Avenue, Lone Hill, Sandton, Gauteng, 2062',
  ),
  branch('3', 'Capitec Bank ATM Sandton Station', 'Sandton Station, Rivonia Road, Sandton, Gauteng, 2196', {
    type: 'atm',
    services: ['ATM'],
  }),
  branch('4', 'Capitec Bank Paarl', 'Lady Grey Street, Paarl, Western Cape, 7646'),
  branch('5', 'Capitec Bank Cavendish Square', '1 Dreyer Street, Claremont, Cape Town, Western Cape, 7708'),
  branch('6', 'Capitec Bank Café Plaza', 'Station Drive, Durban, KwaZulu-Natal, 4001'),
  branch('7', 'Capitec Bank Closed Forever', 'Old Road, Sandton, Gauteng, 2196', { status: 'permanently-closed' }),
]

const index = buildPlaceIndex(branches)
const labels = (list: { label: string }[]) => list.map((item) => item.label)
const names = (list: { name: string }[]) => list.map((item) => item.name)

describe('buildPlaceIndex', () => {
  it('takes the town and suburb from each address, with how many branches are there', () => {
    const sandton = index.find((place) => place.label === 'Sandton')

    expect(sandton).toMatchObject({ kind: 'place', count: 3 })
    expect(index.find((place) => place.label === 'Paarl')).toMatchObject({ count: 1 })
    expect(index.find((place) => place.label === 'Claremont')).toMatchObject({ count: 1 })
    expect(index.find((place) => place.label === 'Cape Town')).toMatchObject({ count: 1 })
  })

  it('leaves out streets, shopping centres and anything with a number in it', () => {
    const all = labels(index)

    expect(all).not.toContain('Twilight Avenue')
    expect(all).not.toContain('Fourways Crossing')
    expect(all).not.toContain('Rivonia Road')
    expect(all).not.toContain('Station Drive')
    expect(all).not.toContain('Shop G35')
    expect(all).not.toContain('1 Dreyer Street')
  })

  it('does not count permanently closed sites', () => {
    expect(index.find((place) => place.label === 'Sandton')?.count).toBe(3)
  })

  it('includes the provinces and the postcodes, each with a count', () => {
    expect(index.find((place) => place.label === 'Gauteng')).toMatchObject({ kind: 'province', count: 3 })
    expect(index.find((place) => place.label === '2196')).toMatchObject({ kind: 'postcode', count: 2 })
  })

  it('merges places that differ only in case or accents', () => {
    const merged = buildPlaceIndex([
      branch('a', 'A', 'Main Street, Pretoria, Gauteng, 0001'),
      branch('b', 'B', 'Church Street, PRETORIA, Gauteng, 0002'),
      branch('c', 'C', 'Long Street, Pretória, Gauteng, 0003'),
    ])

    expect(
      merged.filter((place) => place.kind === 'place' && place.label.toLowerCase().startsWith('pretor')),
    ).toHaveLength(1)
  })
})

describe('suggest', () => {
  it(`suggests nothing until there are ${MIN_QUERY_LENGTH} characters`, () => {
    expect(suggest('', index, branches)).toEqual({ places: [], branches: [] })
    expect(suggest('s', index, branches)).toEqual({ places: [], branches: [] })
    expect(suggest('   ', index, branches)).toEqual({ places: [], branches: [] })
  })

  it('suggests places that start with what was typed, ignoring case', () => {
    expect(labels(suggest('SAND', index, branches).places)).toEqual(['Sandton'])
  })

  it('puts places that start with the text before places that merely contain it', () => {
    const result = suggest('ton', index, branches)

    // "Sandton" only contains "ton"; nothing starts with it.
    expect(labels(result.places)).toContain('Sandton')
    const more = suggest('ca', index, branches)
    expect(labels(more.places)[0]).toBe('Cape Town')
  })

  it('ranks places with more branches first when they match equally well', () => {
    const many = buildPlaceIndex([
      branch('a', 'A', 'Main Street, Parys, Free State, 9585'),
      branch('b', 'B', 'Main Street, Paarl, Western Cape, 7646'),
      branch('c', 'C', 'Church Street, Paarl, Western Cape, 7646'),
    ])

    expect(labels(suggest('pa', many, []).places).slice(0, 2)).toEqual(['Paarl', 'Parys'])
  })

  it('ignores accents in what was typed', () => {
    expect(names(suggest('cafe', index, branches).branches)).toEqual(['Capitec Bank Café Plaza'])
  })

  it('suggests provinces and postcodes', () => {
    expect(labels(suggest('gaut', index, branches).places)).toEqual(['Gauteng'])
    expect(labels(suggest('21', index, branches).places)).toEqual(['2196'])
  })

  it('suggests branches whose name has every word that was typed', () => {
    expect(names(suggest('capitec sandton', index, branches).branches)).toEqual([
      'Capitec Bank Sandton City',
      'Capitec Bank ATM Sandton Station',
    ])
  })

  it('suggests branches that start with the text before others', () => {
    const result = suggest('capitec bank c', index, branches)

    expect(names(result.branches)).toEqual(
      expect.arrayContaining(['Capitec Bank Café Plaza', 'Capitec Bank Cavendish Square']),
    )
  })

  it('never suggests a permanently closed site', () => {
    expect(names(suggest('closed', index, branches).branches)).toEqual([])
  })

  it('says which town a branch is in, and whether it is a branch or an ATM', () => {
    const [first] = suggest('sandton station', index, branches).branches

    expect(first).toMatchObject({ id: '3', type: 'atm', place: 'Sandton' })
  })

  it('limits how many suggestions of each kind it returns', () => {
    const result = suggest('capitec', index, branches, { places: 1, branches: 2 })

    expect(result.branches).toHaveLength(2)
    expect(suggest('s', index, branches, { places: 1, branches: 2 }).places).toHaveLength(0)
    expect(suggest('sa', index, branches, { places: 0, branches: 2 }).places).toHaveLength(0)
  })

  it('returns nothing when nothing matches', () => {
    expect(suggest('zzzzz', index, branches)).toEqual({ places: [], branches: [] })
  })
})
