export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

/** The widest phone layout: below this the controls float on top and the results sheet covers the map. */
export const WIDE_LAYOUT_QUERY = '(min-width: 768px)'

/**
 * Space to keep clear when moving the map. On a phone the controls cover the top and the
 * results sheet covers the bottom 42%, so the visible map is a band in between; on wider
 * screens the panel sits beside the map and only a small margin is needed. While a place is open
 * on a phone the sheet is the same height as the list's (so nothing jumps when a place is opened)
 * and the controls are gone, so the visible map is the strip above the sheet.
 */
export function viewPadding(isWide: boolean, height: number, detail = false): Padding {
  if (isWide) return { top: 48, right: 48, bottom: 48, left: 48 }
  if (detail) return { top: 24, right: 24, bottom: Math.round(height * 0.42), left: 24 }
  return { top: Math.round(height * 0.26), right: 24, bottom: Math.round(height * 0.42), left: 24 }
}

/** Breathing room kept between the pins and the controls or the sheet, in pixels. */
const EDGE_MARGIN = 16

/**
 * On a phone, the space the floating controls and the results sheet really take of the map, measured
 * from the page, or null where it cannot be measured (the layout is not there, or has no size). The
 * measured space is what is left to look at, so the map uses all of it: a fixed share of the screen
 * wasted some of the strip, and made moves to a few nearby places look timid next to the desktop.
 */
export function measuredPhonePadding(map: HTMLElement): Padding | null {
  const root = map.closest('.locator')
  const controls = root?.querySelector('.locator__controls')
  const sheet = root?.querySelector('.locator__results')
  const box = map.getBoundingClientRect()
  if (!controls || !sheet || box.height === 0) return null

  const controlsBox = controls.getBoundingClientRect()
  const sheetBox = sheet.getBoundingClientRect()
  // Hidden controls (while the details are open) have no size, and take no room.
  const top = controlsBox.height > 0 ? Math.max(0, controlsBox.bottom - box.top) : 0
  const bottom = Math.max(0, box.bottom - sheetBox.top)
  return { top: Math.round(top + EDGE_MARGIN), right: 24, bottom: Math.round(bottom + EDGE_MARGIN), left: 24 }
}

/**
 * The padding for moving the map: a small margin beside the panel on a wide screen; on a phone, what
 * is measured, or the fixed shares in `viewPadding` where it cannot be.
 */
export function mapPadding(map: HTMLElement, detail = false): Padding {
  const height = map.clientHeight
  if (isWideLayout()) return viewPadding(true, height, detail)
  return measuredPhonePadding(map) ?? viewPadding(false, height, detail)
}

/** Whether the browser is in the wide layout. Safe where matchMedia does not exist. */
export function isWideLayout(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(WIDE_LAYOUT_QUERY).matches
}

/** How long map moves take, in milliseconds. MapLibre's own default, written out on purpose. */
export const MOVE_DURATION_MS = 500

/**
 * Map moves are instant for people who ask for reduced motion. This always returns a number:
 * MapLibre merges options with Object.assign-style logic, so passing `undefined` to mean
 * "default" would overwrite its default and turn the animation into NaN.
 */
export function motionDuration(): number {
  const reduced =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return reduced ? 0 : MOVE_DURATION_MS
}
