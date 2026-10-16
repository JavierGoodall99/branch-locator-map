import type { ReactNode } from 'react'

interface LocatorLayoutProps {
  /** Search, type switcher and filters. */
  controls: ReactNode
  /** The results heading and list. */
  results: ReactNode
  /** The map. It supplements the list, so it is a labelled region, not the main content. */
  map: ReactNode
  /**
   * One branch is open. Its details then take the whole sidebar: the controls step aside (they are
   * hidden, not removed, so what was typed is still there on return).
   */
  detailOpen?: boolean
}

/**
 * Page layout for the branch locator.
 *
 * From 768px wide it is a side panel (controls above results) beside the map. Below that
 * the map fills the screen, the controls float over it and the results sit in a sheet.
 * DOM order is controls, results, map, so the list works as a complete alternative to the map.
 */
export function LocatorLayout({ controls, results, map, detailOpen = false }: LocatorLayoutProps) {
  return (
    <div className={detailOpen ? 'locator locator--detail' : 'locator'}>
      <a className="locator__skip" href="#results">
        Skip to results
      </a>
      <header className="locator__controls">{controls}</header>
      <main className="locator__results" id="results" tabIndex={-1}>
        {results}
      </main>
      <div className="locator__map" role="region" aria-label="Map of branches and ATMs">
        {map}
      </div>
    </div>
  )
}
