import type { Branch } from '../types'
import { filterBranches, type BranchFilters } from './filter'

const byName = (a: Branch, b: Branch) => a.name.localeCompare(b.name)

/**
 * The branches the user sees, in the order they see them. The list and the detail view's
 * Previous and Next both use this, so they always agree.
 */
export function listBranches(branches: Branch[], filters: BranchFilters, now: Date): Branch[] {
  return filterBranches(branches, filters, now).sort(byName)
}
