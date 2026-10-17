import type { Branch, Coordinates } from '../types'
import { withDistanceFrom } from './distance'
import { filterBranches, type BranchFilters } from './filter'

/** A branch in the list. It has a distance only when the user's location is known. */
export type ListedBranch = Branch & { distanceKm?: number }

const byName = (a: Branch, b: Branch) => a.name.localeCompare(b.name)

/** How the list is ordered: nearest first (which needs the user's location), or by name. */
export type SortMode = 'distance' | 'name'

/**
 * The branches the user sees, in the order they see them: nearest first when their location is
 * known and asked for, otherwise by name. Distances are kept either way once the location is known. With a location, `radiusKm` also drops everything farther away than
 * that. The list and the map both use this, so they always agree.
 */
export function listBranches(
  branches: Branch[],
  filters: BranchFilters,
  now: Date,
  origin?: Coordinates | null,
  radiusKm?: number | null,
  sort: SortMode = 'distance',
): ListedBranch[] {
  const matches = filterBranches(branches, filters, now)
  if (!origin) return matches.sort(byName)

  const nearest = withDistanceFrom(matches, origin)
  const within = radiusKm == null ? nearest : nearest.filter((branch) => branch.distanceKm <= radiusKm)
  return sort === 'name' ? within.sort(byName) : within
}
