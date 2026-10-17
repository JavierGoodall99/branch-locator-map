import { MOVE_DURATION_MS, isWideLayout, motionDuration, viewPadding } from './view'

describe('viewPadding', () => {
  it('uses an even margin beside the side panel on wide screens', () => {
    expect(viewPadding(true, 900)).toEqual({ top: 48, right: 48, bottom: 48, left: 48 })
  })

  it('keeps the top controls and the results sheet clear on a phone', () => {
    expect(viewPadding(false, 800)).toEqual({ top: 272, right: 24, bottom: 360, left: 24 })
  })

  it('keeps only the taller details sheet clear on a phone, because the controls are hidden then', () => {
    expect(viewPadding(false, 800, true)).toEqual({ top: 24, right: 24, bottom: 544, left: 24 })
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
