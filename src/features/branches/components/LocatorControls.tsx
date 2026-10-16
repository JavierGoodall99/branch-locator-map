import { useId, useState } from 'react'
import { countChosenFilters, type LocatorFilters } from '../model/filters'
import type { UseLocationResult } from '../model/useLocation'
import type { Branch } from '../types'
import { BrandHeader } from './BrandHeader'
import { FilterButton } from './FilterButton'
import { FilterPanel } from './FilterPanel'
import { LocateButton, LocationNote } from './LocationControl'
import { SearchBox } from './SearchBox'

interface LocatorControlsProps {
  filters: LocatorFilters
  onChange: (filters: LocatorFilters) => void
  location: UseLocationResult
  /** Everything that can be suggested while the user types. */
  branches: Branch[]
  /** A branch suggestion was chosen. */
  onPickBranch: (id: string) => void
}

/** Brand, search with suggestions and Near me, the Filters button and its panel. */
export function LocatorControls({ filters, onChange, location, branches, onPickBranch }: LocatorControlsProps) {
  const panelId = useId()
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <>
      <BrandHeader />

      <div className="search-row">
        <SearchBox
          value={filters.query}
          onSearch={(query) => onChange({ ...filters, query })}
          branches={branches}
          onPickBranch={onPickBranch}
          trailing={<LocateButton location={location} />}
        />
        <FilterButton
          open={filtersOpen}
          controls={panelId}
          count={countChosenFilters(filters)}
          onToggle={() => setFiltersOpen((open) => !open)}
        />
      </div>

      {filtersOpen && (
        <FilterPanel id={panelId} filters={filters} onChange={onChange} located={location.status === 'located'} />
      )}

      <LocationNote location={location} />
    </>
  )
}
