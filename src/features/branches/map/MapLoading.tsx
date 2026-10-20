/**
 * Shown while the map loads: a spinner on a small white tile. The words are only for screen readers,
 * which hear them as a status message; the spinner is the picture of the same thing.
 */
export function MapLoading() {
  return (
    <div className="map-status map-status--loading" role="status">
      <span className="spinner-border text-primary" aria-hidden="true" />
      <span className="visually-hidden">Loading map…</span>
    </div>
  )
}
