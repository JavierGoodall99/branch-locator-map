const SHOW = 'maplibregl-compact-show'
/** Set while the credit waits to be closed; the style keeps it at its closed size, so it does not jump. */
const SETTLING = 'data-settling'
// If MapLibre never opens it, stop holding it closed after this long.
const SETTLING_LIMIT_MS = 15_000

/**
 * Keeps the map's credit closed when the map starts, leaving only its small info button.
 *
 * MapLibre starts a compact credit showing its text, which on a phone is a wide white pill over the
 * map, and only closes it after the map is moved. The credit is filled in a moment after the map
 * loads, as the style's sources arrive, and that is when MapLibre opens it; so this waits for that,
 * closes it once, and then leaves it alone, so the button works as usual. The credit stays on the
 * page throughout, and is one tap away. (In MapLibre the text shows while the control has the
 * `maplibregl-compact-show` class, and the button toggles that class.)
 *
 * Until then the credit is held at the size of the button (the `data-settling` attribute, see
 * `_branch-map.scss`), because a credit that opens wide for a moment and then closes moves the
 * controls beside it, which counts as a layout shift.
 *
 * Returns a function that stops watching.
 */
export function collapseAttribution(map: HTMLElement): () => void {
  const credit = map.querySelector('.maplibregl-ctrl-attrib')
  if (!credit) return () => {}

  const settled = () => credit.removeAttribute(SETTLING)

  const close = () => {
    if (!credit.classList.contains(SHOW)) return false
    credit.classList.remove(SHOW)
    settled()
    return true
  }

  credit.setAttribute(SETTLING, '')

  // Already open: close it now, and there is nothing to wait for.
  if (close()) return () => {}

  const stop = () => {
    observer.disconnect()
    clearTimeout(giveUp)
    settled()
  }
  const observer = new MutationObserver(() => {
    if (close()) stop()
  })
  const giveUp = setTimeout(stop, SETTLING_LIMIT_MS)
  observer.observe(credit, { attributes: true, attributeFilter: ['class'] })
  return stop
}
