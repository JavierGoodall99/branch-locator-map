const SHOW = 'maplibregl-compact-show'

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
 * Returns a function that stops watching.
 */
export function collapseAttribution(map: HTMLElement): () => void {
  const credit = map.querySelector('.maplibregl-ctrl-attrib')
  if (!credit) return () => {}

  const close = () => {
    if (!credit.classList.contains(SHOW)) return false
    credit.classList.remove(SHOW)
    return true
  }

  // Already open: close it now, and there is nothing to wait for.
  if (close()) return () => {}

  const observer = new MutationObserver(() => {
    if (close()) observer.disconnect()
  })
  observer.observe(credit, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
