import { directionsUrl, telUrl } from './links'

describe('directionsUrl', () => {
  it('builds a directions url from coordinates', () => {
    expect(directionsUrl({ lat: -33.9, lng: 18.4 })).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-33.9,18.4',
    )
  })
})

describe('telUrl', () => {
  it('strips spaces and punctuation from phone numbers', () => {
    expect(telUrl('+27 (86) 010-2043')).toBe('tel:+27860102043')
  })

  it('works for numbers without a country code', () => {
    expect(telUrl('0860 102 043')).toBe('tel:0860102043')
  })
})
