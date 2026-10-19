import { Icon } from '@/shared/ui/Icon'
import type { UseLocationResult } from '@/features/branches/model/useLocation'

const EXPLANATION = 'Near me sorts by distance. Your location stays on your device.'

interface Note {
  /** The short part, which is all a phone shows. */
  summary: string
  /** What to do next. It is shown beside the map, and always read out; on a phone it is not shown, to save room. */
  more: string
}

/**
 * What to tell the user, when there is something to say. Nothing before the button is used, and
 * nothing once it works, because the cards then show distances. While it is finding the location
 * the button's icon spins, so the words are only for screen readers. Every failure message says
 * what to do next, in its second part.
 */
function note(location: UseLocationResult): Note {
  switch (location.status) {
    case 'locating':
      return { summary: 'Finding your location…', more: '' }
    case 'denied':
      // Blocked: the browser will not ask again, so pressing Try again could not open its prompt. Say
      // what does help, and that we will notice (see useLocation).
      if (location.blocked) {
        return {
          summary: 'Location is blocked. Allow it in your browser.',
          more: 'Use the lock icon beside the web address, and we’ll find you as soon as you do. Or search by name, suburb or postcode.',
        }
      }
      return {
        summary: 'Location is turned off for this site.',
        more: 'Allow it when your browser asks, or search by name, suburb or postcode.',
      }
    case 'failed':
      return {
        summary: 'We couldn’t find your location.',
        more: 'Try again, or search by name, suburb or postcode.',
      }
    case 'unavailable':
      return {
        summary: 'This browser can’t share your location.',
        more: 'Search by name, suburb or postcode instead.',
      }
    default:
      return { summary: '', more: '' }
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
 * appears. Beside the map it is two lines of plain text; on a phone it is a slim pill with only the
 * short part and Try again, so it does not take the map's room, and the rest is still read out.
 */
export function LocationNote({ location }: { location: UseLocationResult }) {
  const { summary, more } = note(location)
  // The spinning icon already shows progress, so that message is announced but not displayed.
  const shown = Boolean(summary) && location.status !== 'locating'
  // A blocked site cannot be asked again, so there is nothing to retry until the user allows it.
  const canRetry = (location.status === 'denied' && !location.blocked) || location.status === 'failed'

  return (
    <p className={shown ? 'location-note' : 'visually-hidden'} role="status">
      {summary && <span className="location-note__summary">{summary}</span>}
      {more && <span className="location-note__more"> {more}</span>}
      {canRetry && (
        <button type="button" className="location-note__retry" onClick={location.request}>
          Try again
        </button>
      )}
    </p>
  )
}
