import { MOVE_DURATION_MS, isWideLayout, motionDuration, viewPadding } from './view'

describe('viewPadding', () => {
  it('uses an even margin beside the side panel on wide screens', () => {
    expect(viewPadding(true, 900)).toEqual({ top: 48, right: 48, bottom: 48, left: 48 })
  })

  it('keeps the top controls and the bottom half sheet clear on a phone', () => {
    expect(viewPadding(false, 800)).toEqual({ top: 240, right: 24, bottom: 400, left: 24 })
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
