import hero from '@/assets/capitec-atm.jpg?w=480;800;1200&format=avif;webp;jpg&as=picture'
import placeholder from '@/assets/capitec-atm.jpg?w=32&blur=3&format=webp&inline'

/** The sidebar is at most 440px wide. The photo is only used beside the map, so this is its only size. */
export const HERO_SIZES = '440px'

/** The photo at its three widths, in AVIF, WebP and JPEG, with the fallback's pixel size. */
export { hero }

/**
 * A 32 pixel blurred copy of the photo, as a data address inside the page's own code. It is on screen
 * from the first frame, behind the real photo, so there is never a plain coloured block while the real
 * one arrives: only a soft version of the same picture, sharpened as it loads.
 */
export { placeholder }

let started = false

/**
 * Starts fetching and decoding the photo before anyone asks for it, so that by the time a place is
 * opened it is already in the browser's cache, and shows in the first frame.
 *
 * It builds the same `<picture>` the details use, with the same sources and the same `sizes`, so the
 * browser picks the same file for this screen; the details' image then comes from the cache instead of
 * the network. It does nothing the second time it is called.
 */
export function preloadHeroImage(): void {
  if (started) return
  started = true

  const picture = document.createElement('picture')
  for (const [format, srcSet] of Object.entries(hero.sources)) {
    const source = document.createElement('source')
    source.type = `image/${format === 'jpg' ? 'jpeg' : format}`
    source.srcset = srcSet
    source.sizes = HERO_SIZES
    picture.append(source)
  }

  const image = document.createElement('img')
  image.sizes = HERO_SIZES
  image.decoding = 'async'
  image.src = hero.img.src
  picture.append(image)

  // Decoding it now, as well as fetching it, takes the work off the moment it is first shown. A failure
  // here only means the details fetch it themselves, as they always could.
  image.decode?.().catch(() => {})
}

/** Only for tests: forgets that the photo was already requested. */
export function resetHeroPreloadForTests(): void {
  started = false
}
