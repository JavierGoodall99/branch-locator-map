import { Icon } from '../../../shared/ui/Icon'
import type { UseLocationResult } from '../model/useLocation'

/** What to tell the user in each state. Every message says what to do next, not just what failed. */
function note(location: UseLocationResult): string {
  switch (location.status) {
    case 'idle':
      return 'Near me sorts by distance. Your location stays on your device.'
    case 'locating':
      return 'Finding your location…'
    case 'located':
      return 'Showing the nearest first.'
    case 'denied':
      return 'Location is turned off for this site. Turn it on in your browser settings, or search by name, suburb or postcode.'
    case 'failed':
      return 'We couldn’t find your location. Try again, or search by name, suburb or postcode.'
    case 'unavailable':
      return 'This browser can’t share your location. Search by name, suburb or postcode instead.'
  }
}

/**
 * The Near me button, an icon that sits inside the search bar. It only asks the browser for the
 * location when it is pressed. Pressed again once located, it turns the location off.
 */
export function LocateButton({ location }: { location: UseLocationResult }) {
  const located = location.status === 'located'
  const locating = location.status === 'locating'

  return (
    <button
      type="button"
      className="search-box__action search-box__locate"
      aria-label={locating ? 'Finding your location' : 'Near me'}
      title="Near me"
      aria-pressed={located}
      aria-busy={locating}
      disabled={locating}
      onClick={located ? location.clear : location.request}
    >
      <Icon name="locate" />
    </button>
  )
}

/**
 * A note under the search that explains Near me. It is visible before the user taps, so they know
 * why the browser is about to ask for their location, and it says what to do if that fails.
 */
export function LocationNote({ location }: { location: UseLocationResult }) {
  const canRetry = location.status === 'denied' || location.status === 'failed'

  return (
    <p className="location-note" role="status">
      {note(location)}{' '}
      {canRetry && (
        <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={location.request}>
          Try again
        </button>
      )}
    </p>
  )
}
