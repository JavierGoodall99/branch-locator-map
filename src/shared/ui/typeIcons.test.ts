import { ATM_ICON, BRANCH_ICON, parseIconSvg } from './typeIcons'

describe('parseIconSvg', () => {
  it('reads the path and the stroke width', () => {
    expect(parseIconSvg('<svg stroke-width="2.25"><path d="M1 1h2"/></svg>')).toEqual({
      path: 'M1 1h2',
      strokeWidth: 2.25,
    })
  })

  it('defaults to a stroke width of 2 when the file does not say', () => {
    expect(parseIconSvg('<svg><path d="M1 1h2"/></svg>').strokeWidth).toBe(2)
  })

  it('refuses a file with no path rather than drawing nothing', () => {
    expect(() => parseIconSvg('<svg></svg>')).toThrow('no path')
  })
})

describe('the provided icons', () => {
  it('has a building for a branch, with a 2px stroke', () => {
    expect(BRANCH_ICON.path).toMatch(/^M3\.5 9\.5 12 4l8\.5 5\.5/)
    expect(BRANCH_ICON.strokeWidth).toBe(2)
  })

  it('has a card for an ATM, with a 2.25px stroke', () => {
    expect(ATM_ICON.path).toMatch(/^M3\.5 6\.5h17v11h-17z/)
    expect(ATM_ICON.strokeWidth).toBe(2.25)
  })
})
