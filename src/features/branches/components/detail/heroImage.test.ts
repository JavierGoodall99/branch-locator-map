import { HERO_SIZES, hero, placeholder, preloadHeroImage, resetHeroPreloadForTests } from './heroImage'

/** The elements the preload makes, which never reach the page, so the tests read them as they are made. */
function watchCreatedElements() {
  const made: HTMLElement[] = []
  const create = document.createElement.bind(document)
  vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    const element = create(tag)
    made.push(element)
    return element
  }) as typeof document.createElement)
  return made
}

describe('preloadHeroImage', () => {
  beforeEach(() => resetHeroPreloadForTests())
  afterEach(() => {
    vi.restoreAllMocks()
    Reflect.deleteProperty(HTMLImageElement.prototype, 'decode')
  })

  it('builds the same picture the details use: every format, the same sizes, the same fallback', () => {
    const made = watchCreatedElements()

    preloadHeroImage()

    const picture = made.find((element) => element.tagName === 'PICTURE') as HTMLPictureElement
    const sources = [...picture.querySelectorAll('source')]
    expect(sources.map((source) => source.type)).toEqual(
      Object.keys(hero.sources).map((format) => `image/${format === 'jpg' ? 'jpeg' : format}`),
    )
    expect(sources.map((source) => source.getAttribute('srcset'))).toEqual(Object.values(hero.sources))
    expect(sources.every((source) => source.sizes === HERO_SIZES)).toBe(true)
    const image = picture.querySelector('img')!
    expect(image.getAttribute('src')).toBe(hero.img.src)
    expect(image.sizes).toBe(HERO_SIZES)
  })

  it('decodes the image as well as fetching it, so showing it later costs nothing', () => {
    const decode = vi.fn().mockResolvedValue(undefined)
    HTMLImageElement.prototype.decode = decode

    preloadHeroImage()

    expect(decode).toHaveBeenCalledTimes(1)
  })

  it('does it once, however many times it is asked', () => {
    const decode = vi.fn().mockResolvedValue(undefined)
    HTMLImageElement.prototype.decode = decode
    const made = watchCreatedElements()

    preloadHeroImage()
    preloadHeroImage()
    preloadHeroImage()

    expect(made.filter((element) => element.tagName === 'IMG')).toHaveLength(1)
    expect(decode).toHaveBeenCalledTimes(1)
  })

  it('copes with a browser that cannot decode ahead of time', () => {
    expect(HTMLImageElement.prototype.decode).toBeUndefined()

    expect(() => preloadHeroImage()).not.toThrow()
  })

  it('copes with a decode that fails, which only means the details fetch the photo themselves', () => {
    const failure = Promise.reject(new Error('no'))
    const handled = vi.spyOn(failure, 'catch')
    HTMLImageElement.prototype.decode = vi.fn().mockReturnValue(failure)

    preloadHeroImage()

    // The failure is caught, so it cannot surface as an error nobody asked for.
    expect(handled).toHaveBeenCalledTimes(1)
  })
})

describe('the placeholder', () => {
  it('is a very small image inside the page itself, so it is there at once', () => {
    expect(placeholder).toMatch(/^data:image\/webp;base64,/)
    expect(placeholder.length).toBeLessThan(2000)
  })
})
