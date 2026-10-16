import type { BranchFilters } from '../lib/filter'
import type { BranchType } from '../types'

/** Which kinds of location the list shows. Business centres count as branches. */
export type ShowMode = 'branches' | 'atms' | 'both'

export interface LocatorFilters {
  query: string
  show: ShowMode
  /** Only list places within this many kilometres of the user, or null for any distance. */
  radiusKm: number | null
}

export const DEFAULT_FILTERS: LocatorFilters = {
  query: '',
  show: 'branches',
  radiusKm: null,
}

/** The distances the user can choose from, in kilometres. */
export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const

const TYPES_FOR: Record<ShowMode, BranchType[]> = {
  branches: ['branch', 'business-centre'],
  atms: ['atm'],
  both: [],
}

/** Converts the UI's filter state into the filter the list logic understands. */
export function toBranchFilters(filters: LocatorFilters): BranchFilters {
  return { query: filters.query, types: TYPES_FOR[filters.show] }
}

/** Whether the user has narrowed the list, by searching or by distance. The show switch is a view choice, not a filter. */
export function hasActiveFilters(filters: LocatorFilters): boolean {
  return filters.query.trim() !== '' || filters.radiusKm !== null
}

/** Clears the search and the distance but keeps the show switch where it is. */
export function clearFilters(filters: LocatorFilters): LocatorFilters {
  return { ...DEFAULT_FILTERS, show: filters.show }
}

/** How many choices in the filter panel differ from their defaults, for the badge on the Filters button. */
export function countChosenFilters(filters: LocatorFilters): number {
  return Number(filters.show !== DEFAULT_FILTERS.show) + Number(filters.radiusKm !== null)
}
