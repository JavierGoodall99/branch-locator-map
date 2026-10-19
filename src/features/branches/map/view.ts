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
 * results sheet covers the bottom 45%, so the visible map is a band in between; on wider
 * screens the panel sits beside the map and only a small margin is needed. While a place is open
 * on a phone its details take a taller sheet (60%) and the controls are gone, so the visible map
 * is the strip above the sheet.
 */
export function viewPadding(isWide: boolean, height: number, detail = false): Padding {
  if (isWide) return { top: 48, right: 48, bottom: 48, left: 48 }
  if (detail) return { top: 24, right: 24, bottom: Math.round(height * 0.6), left: 24 }
  return { top: Math.round(height * 0.34), right: 24, bottom: Math.round(height * 0.45), left: 24 }
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
