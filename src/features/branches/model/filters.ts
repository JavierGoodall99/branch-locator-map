import type { BranchFilters } from '../lib/filter'
import type { BranchType } from '../types'

/** Which kinds of location the list shows. Business centres count as branches. */
export type ShowMode = 'branches' | 'atms' | 'both'

export interface LocatorFilters {
  query: string
  show: ShowMode
}

export const DEFAULT_FILTERS: LocatorFilters = {
  query: '',
  show: 'branches',
}

const TYPES_FOR: Record<ShowMode, BranchType[]> = {
  branches: ['branch', 'business-centre'],
  atms: ['atm'],
  both: [],
}

/** Converts the UI's filter state into the filter the list logic understands. */
export function toBranchFilters(filters: LocatorFilters): BranchFilters {
  return { query: filters.query, types: TYPES_FOR[filters.show] }
}

/** Whether the user has searched. The show switch is a view choice, not a filter. */
export function hasActiveFilters(filters: LocatorFilters): boolean {
  return filters.query.trim() !== ''
}

/** Clears the search but keeps the show switch where it is. */
export function clearFilters(filters: LocatorFilters): LocatorFilters {
  return { ...DEFAULT_FILTERS, show: filters.show }
}
