import { typeLabel } from './labels'

describe('typeLabel', () => {
  it.each([
    ['branch', 'Branch'],
    ['atm', 'ATM'],
    ['business-centre', 'Business centre'],
  ] as const)('calls %s "%s"', (type, label) => {
    expect(typeLabel(type)).toBe(label)
  })
})
