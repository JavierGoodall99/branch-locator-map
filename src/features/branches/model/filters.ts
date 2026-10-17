import type { BranchFilters } from '../lib/filter'
import type { SortMode } from '../lib/listing'
import type { BranchType, Province } from '../types'

/** Which kinds of location the list shows. Business centres count as branches. */
export type ShowMode = 'branches' | 'atms' | 'both'

export interface LocatorFilters {
  query: string
  show: ShowMode
  /** Only list places within this many kilometres of the user, or null for any distance. */
  radiusKm: number | null
  /** Only places that are open now, or closing soon. */
  openNow: boolean
  /** Only places open around the clock. */
  open24Hours: boolean
  province: Province | null
  /** Only places that offer at least one of these services. */
  services: string[]
  /** Nearest first, or by name. Nearest first needs the user's location. */
  sort: SortMode
}

export const DEFAULT_FILTERS: LocatorFilters = {
  query: '',
  show: 'both',
  // 25 km is what the user gets as soon as their location is known; it does nothing before that.
  radiusKm: 25,
  openNow: false,
  open24Hours: false,
  province: null,
  services: [],
  sort: 'distance',
}

/** The filters in the Filters window, which the user sets together and applies once. */
export type WindowFilters = Pick<LocatorFilters, 'openNow' | 'open24Hours' | 'province' | 'services' | 'sort'>

/** The distances the user can choose from, in kilometres. */
export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const

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
    openNow: filters.openNow,
    open24Hours: filters.open24Hours,
    province: filters.province ?? undefined,
    services: filters.services,
  }
}

/** How many filters in the Filters window are in use, for the badge on the Filters button. The sort order is not a filter. */
export function countWindowFilters(filters: Omit<WindowFilters, 'sort'>): number {
  return Number(filters.openNow) + Number(filters.open24Hours) + Number(filters.province !== null) + filters.services.length
}

/** Whether the user has narrowed the list, by searching, by distance or in the Filters window. The show switch is a view choice, not a filter. */
export function hasActiveFilters(filters: LocatorFilters): boolean {
  return filters.query.trim() !== '' || filters.radiusKm !== null || countWindowFilters(filters) > 0
}

/** Whether anything besides the search is narrowing the list. */
export function hasChosenFilters(filters: LocatorFilters): boolean {
  return filters.radiusKm !== null || countWindowFilters(filters) > 0
}

/** Clears the search, the distance (to any distance) and the Filters window, but keeps the show switch where it is. */
export function clearFilters(filters: LocatorFilters): LocatorFilters {
  return { ...DEFAULT_FILTERS, radiusKm: null, show: filters.show }
}
