import { useState } from 'react'
import { Icon, type IconName } from '@/shared/ui/Icon'
import { countWindowFilters, type LocatorFilters, type ShowMode } from '@/features/branches/model/filters'
import type { UseLocationResult } from '@/features/branches/model/useLocation'
import type { Branch } from '@/features/branches/types'
import { BrandHeader } from './BrandHeader'
import { FilterButton } from './FilterButton'
import { FiltersModal } from './FiltersModal'
import { LocateButton, LocationNote } from './LocationControl'
import { RadiusChips } from './RadiusChips'
import { SearchBox } from './SearchBox'

interface LocatorControlsProps {
  filters: LocatorFilters
  onChange: (filters: LocatorFilters) => void
  location: UseLocationResult
  /** Everything that can be suggested while the user types. */
  branches: Branch[]
  /** A branch suggestion was chosen. */
  onPickBranch: (id: string) => void
  /** How many places the list would show with these filters. */
  countResults: (filters: LocatorFilters) => number
}

const SHOW_OPTIONS: { value: ShowMode; label: string; icon?: IconName }[] = [
  { value: 'both', label: 'Both' },
  { value: 'branches', label: 'Branches', icon: 'bank' },
  { value: 'atms', label: 'ATMs', icon: 'cash' },
]

/** Brand, search with suggestions and Near me, the Filters button, the show switch and the distances. */
export function LocatorControls({
  filters,
  onChange,
  location,
  branches,
  onPickBranch,
  countResults,
}: LocatorControlsProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const set = (change: Partial<LocatorFilters>) => onChange({ ...filters, ...change })

  return (
    <>
      <BrandHeader />

      <div className="search-row">
        <SearchBox
          value={filters.query}
          // Searching for a place means looking there, so the distance steps aside: a search for
          // somewhere else would otherwise find nothing.
          onSearch={(query) => set(query ? { query, radiusKm: null } : { query })}
          branches={branches}
          onPickBranch={onPickBranch}
          trailing={<LocateButton location={location} />}
        />
        <FilterButton count={countWindowFilters(filters)} onClick={() => setFiltersOpen(true)} />
      </div>

      <div className="type-switch" role="group" aria-label="Show">
        {SHOW_OPTIONS.map(({ value, label, icon }) => (
          <button key={value} type="button" aria-pressed={filters.show === value} onClick={() => set({ show: value })}>
            {icon && <Icon name={icon} size={18} />}
            {label}
          </button>
        ))}
      </div>

      <RadiusChips radiusKm={filters.radiusKm} onChange={(radiusKm) => set({ radiusKm })} location={location} />

      <LocationNote location={location} />

      <FiltersModal
        show={filtersOpen}
        onHide={() => setFiltersOpen(false)}
        filters={filters}
        branches={branches}
        located={location.status === 'located'}
        onApply={(applied) => set(applied)}
        countResults={(window) => countResults({ ...filters, ...window })}
      />
    </>
  )
}
