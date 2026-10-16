import { useId } from 'react'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { RADIUS_OPTIONS, type LocatorFilters, type ShowMode } from '../model/filters'

interface FilterPanelProps {
  id: string
  filters: LocatorFilters
  onChange: (filters: LocatorFilters) => void
  /** Whether the user's location is known. Distance needs it, so the choices are off without it. */
  located: boolean
}

const SHOW_OPTIONS: { value: ShowMode; label: string; icon?: IconName }[] = [
  { value: 'branches', label: 'Branches', icon: 'bank' },
  { value: 'atms', label: 'ATMs', icon: 'cash' },
  { value: 'both', label: 'Both' },
]

/**
 * What to show (branches, ATMs or both) and how far away, which opens from the Filters button.
 * Distance is measured from the user, so it can only be chosen once Near me is on; until then the
 * choices are off and say why.
 */
export function FilterPanel({ id, filters, onChange, located }: FilterPanelProps) {
  const labelId = useId()
  const hintId = useId()
  const set = (change: Partial<LocatorFilters>) => onChange({ ...filters, ...change })

  return (
    <div className="filter-panel" id={id}>
      <div className="type-switch" role="group" aria-label="Show">
        {SHOW_OPTIONS.map(({ value, label, icon }) => (
          <button key={value} type="button" aria-pressed={filters.show === value} onClick={() => set({ show: value })}>
            {icon && <Icon name={icon} size={18} />}
            {label}
          </button>
        ))}
      </div>

      <div className="filter-panel__group">
        <p className="filter-panel__label" id={labelId}>
          Within
        </p>
        <div
          className="radius-chips"
          role="group"
          aria-labelledby={labelId}
          aria-describedby={located ? undefined : hintId}
        >
          {RADIUS_OPTIONS.map((km) => {
            const chosen = filters.radiusKm === km
            return (
              <button
                key={km}
                type="button"
                className="radius-chip"
                aria-pressed={chosen}
                disabled={!located}
                // Pressing the chosen distance again goes back to any distance.
                onClick={() => set({ radiusKm: chosen ? null : km })}
              >
                {km} km
              </button>
            )
          })}
        </div>
        {!located && (
          <p className="filter-panel__hint" id={hintId}>
            Turn on Near me, the target icon in the search bar, to filter by distance.
          </p>
        )}
      </div>
    </div>
  )
}
