import type { BranchFilters } from '../lib/filter'
import type { BranchType, Province } from '../types'

/** Which kinds of location the list shows. Business centres count as branches. */
export type ShowMode = 'branches' | 'atms' | 'both'

export interface LocatorFilters {
  query: string
  show: ShowMode
  openNow: boolean
  province: Province | null
}

export const DEFAULT_FILTERS: LocatorFilters = {
  query: '',
  show: 'branches',
  openNow: false,
  province: null,
}

const TYPES_FOR: Record<ShowMode, BranchType[]> = {
  branches: ['branch', 'business-centre'],
  atms: ['atm'],
  both: [],
}

/** Converts the UI's filter state into the filter the list logic understands. */
export function toBranchFilters(filters: LocatorFilters): BranchFilters {
  return {
    query: filters.query,
    types: TYPES_FOR[filters.show],
    province: filters.province ?? undefined,
    openNow: filters.openNow,
  }
}

/** Whether the user has narrowed the list. The show switch is a view choice, not a filter. */
export function hasActiveFilters(filters: LocatorFilters): boolean {
  return filters.query.trim() !== '' || filters.openNow || filters.province !== null
}

/** Clears the search and filters but keeps the show switch where it is. */
export function clearFilters(filters: LocatorFilters): LocatorFilters {
  return { ...DEFAULT_FILTERS, show: filters.show }
}
