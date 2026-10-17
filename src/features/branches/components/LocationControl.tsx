import { Icon } from '../../../shared/ui/Icon'
import type { UseLocationResult } from '../model/useLocation'

const EXPLANATION = 'Near me sorts by distance. Your location stays on your device.'

/**
 * What to tell the user, when there is something to say. Nothing before the button is used, and
 * nothing once it works, because the cards then show distances. While it is finding the location
 * the button's icon spins, so the words are only for screen readers. Every failure message says
 * what to do next.
 */
function note(location: UseLocationResult): string {
  switch (location.status) {
    case 'locating':
      return 'Finding your location…'
    case 'denied':
      return 'Location is turned off for this site. Turn it on in your browser settings, or search by name, suburb or postcode.'
    case 'failed':
      return 'We couldn’t find your location. Try again, or search by name, suburb or postcode.'
    case 'unavailable':
      return 'This browser can’t share your location. Search by name, suburb or postcode instead.'
    default:
      return ''
  }
}

/**
 * The Near me button, an icon that sits inside the search bar. It only asks the browser for the
 * location when it is pressed. Pressed again once located, it turns the location off. What it does
 * is its tooltip, and its description for screen readers, instead of text on the page. While it
 * is finding the location the icon itself spins.
 */
export function LocateButton({ location }: { location: UseLocationResult }) {
  const located = location.status === 'located'
  const locating = location.status === 'locating'

  return (
    <button
      type="button"
      className="search-box__action search-box__locate"
      aria-label={locating ? 'Finding your location' : 'Near me'}
      title={EXPLANATION}
      aria-pressed={located}
      aria-busy={locating}
      disabled={locating}
      onClick={located ? location.clear : location.request}
    >
      <span className={locating ? 'search-box__spin' : undefined}>
        <Icon name="locate" size={18} />
      </span>
    </button>
  )
}

/**
 * A note under the search for when Near me has not worked. It stays in the page even when empty,
 * and while locating it is visually hidden, so a screen reader announces each message when it
 * appears.
 */
export function LocationNote({ location }: { location: UseLocationResult }) {
  const message = note(location)
  // The spinning icon already shows progress, so that message is announced but not displayed.
  const shown = Boolean(message) && location.status !== 'locating'
  const canRetry = location.status === 'denied' || location.status === 'failed'

  return (
    <p className={shown ? 'location-note' : 'visually-hidden'} role="status">
      {message}
      {canRetry && (
        <>
          {' '}
          <button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={location.request}>
            Try again
          </button>
        </>
      )}
    </p>
  )
}
