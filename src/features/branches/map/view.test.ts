import { MOVE_DURATION_MS, isWideLayout, mapPadding, measuredPhonePadding, motionDuration, viewPadding } from './view'

describe('viewPadding', () => {
  it('uses an even margin beside the side panel on wide screens', () => {
    expect(viewPadding(true, 900)).toEqual({ top: 48, right: 48, bottom: 48, left: 48 })
  })

  it('keeps the top controls and the results sheet clear on a phone', () => {
    expect(viewPadding(false, 800)).toEqual({ top: 208, right: 24, bottom: 336, left: 24 })
  })

  it('keeps only the details sheet clear on a phone, because the controls are hidden then', () => {
    expect(viewPadding(false, 800, true)).toEqual({ top: 24, right: 24, bottom: 336, left: 24 })
  })

  it('does not change the wide layout for the details', () => {
    expect(viewPadding(true, 900, true)).toEqual(viewPadding(true, 900))
  })
})

describe('matchMedia helpers', () => {
  afterEach(() => vi.unstubAllGlobals())

  const stubMatchMedia = (matches: (query: string) => boolean) =>
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: matches(query), media: query })),
    )

  it('is not wide where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(isWideLayout()).toBe(false)
  })

  it('reads the wide layout from the 768px query', () => {
    stubMatchMedia((query) => query === '(min-width: 768px)')

    expect(isWideLayout()).toBe(true)
  })

  it('makes moves instant when reduced motion is requested', () => {
    stubMatchMedia((query) => query === '(prefers-reduced-motion: reduce)')

    expect(motionDuration()).toBe(0)
  })

  it('uses a real duration otherwise, never undefined', () => {
    stubMatchMedia(() => false)

    expect(motionDuration()).toBe(MOVE_DURATION_MS)
    expect(motionDuration()).toBeGreaterThan(0)
  })
})

/** A page laid out like the phone layout, with each box given the size it would have on a 390 by 844 screen. */
function phonePage(sizes: { map: [number, number]; controls: [number, number]; sheetTop: number }) {
  document.body.innerHTML = `
    <div class="locator">
      <header class="locator__controls"></header>
      <main class="locator__results"></main>
      <div class="locator__map"><div class="branch-map__canvas"></div></div>
    </div>`
  const rect = (top: number, bottom: number) =>
    ({ top, bottom, height: bottom - top, left: 0, right: 390, width: 390 }) as DOMRect
  const map = document.querySelector('.locator__map') as HTMLElement
  const canvas = document.querySelector('.branch-map__canvas') as HTMLElement
  map.getBoundingClientRect = () => rect(0, sizes.map[1])
  canvas.getBoundingClientRect = () => rect(0, sizes.map[1])
  document.querySelector('.locator__controls')!.getBoundingClientRect = () => rect(sizes.controls[0], sizes.controls[1])
  document.querySelector('.locator__results')!.getBoundingClientRect = () => rect(sizes.sheetTop, sizes.map[1])
  return canvas
}

describe('measuredPhonePadding', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('keeps clear of the controls and the sheet as they really are, with a margin', () => {
    const canvas = phonePage({ map: [390, 844], controls: [0, 190], sheetTop: 464 })

    expect(measuredPhonePadding(canvas)).toEqual({ top: 206, right: 24, bottom: 396, left: 24 })
  })

  it('leaves more of the map than the fixed shares did, which kept 26% and 42%', () => {
    // The real phone layout: controls about 148px high (more with a note), and the sheet from 58%.
    const canvas = phonePage({ map: [390, 844], controls: [0, 148], sheetTop: 490 })
    const measured = measuredPhonePadding(canvas)!
    const fixed = viewPadding(false, 844)

    expect(measured.top + measured.bottom).toBeLessThan(fixed.top + fixed.bottom)
  })

  it('takes no room for controls that are hidden, as they are while the details are open', () => {
    const canvas = phonePage({ map: [390, 844], controls: [0, 0], sheetTop: 338 })

    expect(measuredPhonePadding(canvas)).toEqual({ top: 16, right: 24, bottom: 522, left: 24 })
  })

  it('follows a lowered sheet, which is only its handle', () => {
    const canvas = phonePage({ map: [390, 844], controls: [0, 190], sheetTop: 788 })

    expect(measuredPhonePadding(canvas)!.bottom).toBe(72)
  })

  it('cannot measure a page that is not laid out, or has no size', () => {
    expect(measuredPhonePadding(document.createElement('div'))).toBeNull()
    const canvas = phonePage({ map: [390, 0], controls: [0, 0], sheetTop: 0 })
    expect(measuredPhonePadding(canvas)).toBeNull()
  })
})

describe('mapPadding', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  const stubWide = (wide: boolean) =>
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: wide && query === '(min-width: 768px)', media: query })),
    )

  it('uses an even margin beside the side panel on a wide screen', () => {
    stubWide(true)
    const canvas = phonePage({ map: [390, 844], controls: [0, 190], sheetTop: 464 })

    expect(mapPadding(canvas)).toEqual({ top: 48, right: 48, bottom: 48, left: 48 })
  })

  it('measures the page on a phone', () => {
    stubWide(false)
    const canvas = phonePage({ map: [390, 844], controls: [0, 190], sheetTop: 464 })

    expect(mapPadding(canvas)).toEqual({ top: 206, right: 24, bottom: 396, left: 24 })
  })

  it('falls back to the fixed shares where the page cannot be measured', () => {
    stubWide(false)
    const bare = document.createElement('div')
    Object.defineProperty(bare, 'clientHeight', { value: 800 })

    expect(mapPadding(bare)).toEqual(viewPadding(false, 800))
    expect(mapPadding(bare, true)).toEqual(viewPadding(false, 800, true))
  })
})
