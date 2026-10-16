import { Icon, type IconName } from '../../../shared/ui/Icon'
import type { LocatorFilters, ShowMode } from '../model/filters'
import type { UseLocationResult } from '../model/useLocation'
import type { Branch } from '../types'
import { BrandHeader } from './BrandHeader'
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

const SHOW_OPTIONS: { value: ShowMode; label: string; icon?: IconName }[] = [
  { value: 'branches', label: 'Branches', icon: 'bank' },
  { value: 'atms', label: 'ATMs', icon: 'cash' },
  { value: 'both', label: 'Both' },
]

/** Brand, search with suggestions and Near me, and the show switch. */
export function LocatorControls({ filters, onChange, location, branches, onPickBranch }: LocatorControlsProps) {
  const set = (change: Partial<LocatorFilters>) => onChange({ ...filters, ...change })

  return (
    <>
      <BrandHeader />

      <SearchBox
        value={filters.query}
        onSearch={(query) => set({ query })}
        branches={branches}
        onPickBranch={onPickBranch}
        trailing={<LocateButton location={location} />}
      />

      <div className="type-switch" role="group" aria-label="Show">
        {SHOW_OPTIONS.map(({ value, label, icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filters.show === value}
            onClick={() => set({ show: value })}
          >
            {icon && <Icon name={icon} size={18} />}
            {label}
          </button>
        ))}
      </div>

      <LocationNote location={location} />
    </>
  )
}
