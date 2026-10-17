import { useId } from 'react'
import { RADIUS_OPTIONS } from '../model/filters'
import type { UseLocationResult } from '../model/useLocation'

interface RadiusChipsProps {
  radiusKm: number | null
  onChange: (radiusKm: number | null) => void
  location: UseLocationResult
}

/**
 * How far away to look: 5, 10, 25, 50 or 100 km, in one row. A distance is measured from the user,
 * so choosing one before the location is known also asks for it, which saves finding the Near me
 * button first. The chosen distance shows as pressed once the location is on its way or found.
 * Pressing the chosen distance again, with the location found, goes back to any distance.
 */
export function RadiusChips({ radiusKm, onChange, location }: RadiusChipsProps) {
  const hintId = useId()
  const located = location.status === 'located'
  const locating = location.status === 'locating'

  const choose = (km: number) => {
    if (located) {
      onChange(radiusKm === km ? null : km)
      return
    }
    // Remember the distance now; the list applies it as soon as the location arrives.
    onChange(km)
    if (!locating) location.request()
  }

  return (
    <>
      <div
        className="radius-chips"
        role="group"
        aria-label="Distance from you"
        aria-describedby={located ? undefined : hintId}
      >
        {RADIUS_OPTIONS.map((km) => (
          <button
            key={km}
            type="button"
            className="chip chip--fill"
            aria-pressed={(located || locating) && radiusKm === km}
            onClick={() => choose(km)}
          >
            {km} km
          </button>
        ))}
      </div>
      {!located && (
        <span className="visually-hidden" id={hintId}>
          Choosing a distance asks for your location.
        </span>
      )}
    </>
  )
}
