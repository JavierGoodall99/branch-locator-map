import type { BranchFilters } from '../lib/filter'
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
  province: Province | null
  /** Only places that offer at least one of these services. */
  services: string[]
}

export const DEFAULT_FILTERS: LocatorFilters = {
  query: '',
  show: 'branches',
  radiusKm: null,
  openNow: false,
  province: null,
  services: [],
}

/** The filters in the Filters window, which the user sets together and applies once. */
export type WindowFilters = Pick<LocatorFilters, 'openNow' | 'province' | 'services'>

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
    province: filters.province ?? undefined,
    services: filters.services,
  }
}

/** How many choices in the Filters window are in use, for the badge on the Filters button. */
export function countWindowFilters(filters: WindowFilters): number {
  return Number(filters.openNow) + Number(filters.province !== null) + filters.services.length
}

/** Whether the user has narrowed the list, by searching, by distance or in the Filters window. The show switch is a view choice, not a filter. */
export function hasActiveFilters(filters: LocatorFilters): boolean {
  return filters.query.trim() !== '' || filters.radiusKm !== null || countWindowFilters(filters) > 0
}

/** Whether anything besides the search is narrowing the list. */
export function hasChosenFilters(filters: LocatorFilters): boolean {
  return filters.radiusKm !== null || countWindowFilters(filters) > 0
}

/** Clears the search, the distance and the Filters window, but keeps the show switch where it is. */
export function clearFilters(filters: LocatorFilters): LocatorFilters {
  return { ...DEFAULT_FILTERS, show: filters.show }
}
