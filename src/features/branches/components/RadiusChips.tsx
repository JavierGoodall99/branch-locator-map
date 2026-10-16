import { useId } from 'react'
import { RADIUS_OPTIONS } from '../model/filters'

interface RadiusChipsProps {
  radiusKm: number | null
  onChange: (radiusKm: number | null) => void
  /** Whether the user's location is known. Distance is measured from it, so the choices are off without it. */
  located: boolean
}

/**
 * How far away to look: 5, 10, 25, 50 or 100 km, in one row. The distances can only be chosen once
 * Near me is on; until then they are off, and a screen reader is told why. Pressing the chosen
 * distance again goes back to any distance.
 */
export function RadiusChips({ radiusKm, onChange, located }: RadiusChipsProps) {
  const hintId = useId()

  return (
    <>
      <div
        className="radius-chips"
        role="group"
        aria-label="Distance from you"
        aria-describedby={located ? undefined : hintId}
      >
        {RADIUS_OPTIONS.map((km) => {
          const chosen = radiusKm === km
          return (
            <button
              key={km}
              type="button"
              className="radius-chip"
              aria-pressed={chosen}
              disabled={!located}
              onClick={() => onChange(chosen ? null : km)}
            >
              {km} km
            </button>
          )
        })}
      </div>
      {!located && (
        <span className="visually-hidden" id={hintId}>
          Turn on Near me, in the search bar, to filter by distance.
        </span>
      )}
    </>
  )
}
