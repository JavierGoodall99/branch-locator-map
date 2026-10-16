import { Icon } from '../../../shared/ui/Icon'

interface FilterButtonProps {
  open: boolean
  /** The id of the panel this button opens. */
  controls: string
  /** How many choices differ from the defaults. */
  count: number
  onToggle: () => void
}

/** The button beside the search that opens and closes the filters. A badge says how many are in use. */
export function FilterButton({ open, controls, count, onToggle }: FilterButtonProps) {
  return (
    <button
      type="button"
      className="filter-button"
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      aria-label={count > 0 ? `Filters, ${count} in use` : 'Filters'}
      onClick={onToggle}
    >
      <Icon name="filter" size={20} />
      {count > 0 && (
        <span className="filter-button__count" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  )
}
