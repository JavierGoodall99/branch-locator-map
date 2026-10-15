import { Form } from 'react-bootstrap'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { clearFilters, hasActiveFilters, type LocatorFilters, type ShowMode } from '../model/filters'
import type { UseLocationResult } from '../model/useLocation'
import { PROVINCES, type Province } from '../types'
import { LocationControl } from './LocationControl'

interface LocatorControlsProps {
  filters: LocatorFilters
  onChange: (filters: LocatorFilters) => void
  location: UseLocationResult
}

const SHOW_OPTIONS: { value: ShowMode; label: string; icon?: IconName }[] = [
  { value: 'branches', label: 'Branches', icon: 'bank' },
  { value: 'atms', label: 'ATMs', icon: 'cash' },
  { value: 'both', label: 'Both' },
]

/** Brand, search, the show switch, the filters and Near me. Filter changes go up through onChange. */
export function LocatorControls({ filters, onChange, location }: LocatorControlsProps) {
  const set = (change: Partial<LocatorFilters>) => onChange({ ...filters, ...change })

  return (
    <>
      <div className="d-none d-md-block">
        <p className="h4 m-0 brand">Capitec</p>
        <p className="small text-body-secondary m-0">Find a branch or ATM</p>
      </div>

      <form role="search" className="search-box" onSubmit={(event) => event.preventDefault()}>
        <Icon name="search" />
        <label htmlFor="branch-search" className="visually-hidden">
          Search by name, suburb, town or postcode
        </label>
        <input
          id="branch-search"
          type="search"
          autoComplete="off"
          placeholder="Name, suburb, town or postcode"
          value={filters.query}
          onChange={(event) => set({ query: event.target.value })}
        />
      </form>

      <div className="type-switch" role="group" aria-label="Show">
        {SHOW_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filters.show === value}
            onClick={() => set({ show: value })}
          >
            {icon && <Icon name={icon} />}
            {label}
          </button>
        ))}
      </div>

      <div className="filter-bar">
        <button
          type="button"
          className="chip"
          aria-pressed={filters.openNow}
          onClick={() => set({ openNow: !filters.openNow })}
        >
          Open now
          {filters.openNow && <Icon name="close" size={16} />}
        </button>

        <Form.Label htmlFor="province-filter" visuallyHidden>
          Province
        </Form.Label>
        <Form.Select
          id="province-filter"
          className="filter-bar__province"
          value={filters.province ?? ''}
          onChange={(event) => set({ province: (event.target.value || null) as Province | null })}
        >
          <option value="">All provinces</option>
          {PROVINCES.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </Form.Select>

        {hasActiveFilters(filters) && (
          <button type="button" className="btn btn-link btn-sm" onClick={() => onChange(clearFilters(filters))}>
            Clear filters
          </button>
        )}
      </div>

      <LocationControl location={location} />
    </>
  )
}
