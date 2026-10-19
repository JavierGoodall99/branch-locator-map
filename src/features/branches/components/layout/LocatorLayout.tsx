import { useState, type ReactNode } from 'react'

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
 * the map fills the screen, the controls float over it and the results sit in a sheet, which a
 * handle on its top edge lowers to a strip (and raises again), so the whole map can be seen.
 * DOM order is controls, results, map, so the list works as a complete alternative to the map.
 */
export function LocatorLayout({ controls, results, map, detailOpen = false }: LocatorLayoutProps) {
  // Only the phone layout uses this: the handle is not shown from 768px, and the CSS ignores it there.
  const [lowered, setLowered] = useState(false)
  const classes = ['locator', detailOpen && 'locator--detail', lowered && 'locator--lowered'].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <a className="locator__skip" href="#results">
        Skip to results
      </a>
      <header className="locator__controls">{controls}</header>
      <main className="locator__results" id="results" tabIndex={-1}>
        {/* A button, not a drag: it works with a keyboard, a screen reader and a thumb alike. Its name
            says what it does next, and it is the same words that show while the sheet is lowered. */}
        <button
          type="button"
          className="sheet-handle"
          aria-controls="results-content"
          onClick={() => setLowered((current) => !current)}
        >
          <span className="sheet-handle__bar" aria-hidden="true" />
          <span className={lowered ? 'sheet-handle__label' : 'visually-hidden'}>
            {lowered ? 'Show results' : 'Hide results'}
          </span>
        </button>
        <div className="locator__results-content" id="results-content">
          {results}
        </div>
      </main>
      <div className="locator__map" role="region" aria-label="Map of branches and ATMs">
        {map}
      </div>
    </div>
  )
}
