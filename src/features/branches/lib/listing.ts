import type { Branch, Coordinates } from '../types'
import { withDistanceFrom } from './distance'
import { filterBranches, type BranchFilters } from './filter'

/** A branch in the list. It has a distance only when the user's location is known. */
export type ListedBranch = Branch & { distanceKm?: number }

const byName = (a: Branch, b: Branch) => a.name.localeCompare(b.name)

/**
 * The branches the user sees, in the order they see them: nearest first when their location is
 * known, otherwise by name. With a location, `radiusKm` also drops everything farther away than
 * that. The list and the map both use this, so they always agree.
 */
export function listBranches(
  branches: Branch[],
  filters: BranchFilters,
  now: Date,
  origin?: Coordinates | null,
  radiusKm?: number | null,
): ListedBranch[] {
  const matches = filterBranches(branches, filters, now)
  if (!origin) return matches.sort(byName)

  const nearest = withDistanceFrom(matches, origin)
  return radiusKm == null ? nearest : nearest.filter((branch) => branch.distanceKm <= radiusKm)
}
