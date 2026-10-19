import { Icon } from '@/shared/ui/Icon'

interface FilterButtonProps {
  /** How many choices in the Filters window are in use. */
  count: number
  onClick: () => void
}

/** The button beside the search that opens the Filters window. A badge says how many filters are in use. */
export function FilterButton({ count, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      className="filter-button"
      aria-haspopup="dialog"
      aria-label={count > 0 ? `Filters, ${count} in use` : 'Filters'}
      onClick={onClick}
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
