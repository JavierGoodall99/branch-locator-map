import type { Branch, BranchType, Province } from '../types'
import { getOpenStatus } from './hours'

export interface BranchFilters {
  /** Free text. Every word must match the name, address, province or postal code. */
  query?: string
  /** Empty or missing means every type. */
  types?: BranchType[]
  province?: Province
  openNow?: boolean
  /** A branch that offers at least one of these. Empty or missing means any. */
  services?: string[]
}

/** Lower-cases, strips accents and trims, so "Café" matches "cafe". */
export function normalise(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

function searchableText(branch: Branch): string {
  return normalise([branch.name, branch.address, branch.province, branch.postalCode].join(' '))
}

/**
 * Applies the filters to `branches`. Permanently closed sites are never returned,
 * because a locator should not send people to them. Temporarily closed sites are kept
 * so the list can say they are closed.
 */
export function filterBranches(branches: Branch[], filters: BranchFilters, now: Date): Branch[] {
  const words = normalise(filters.query ?? '')
    .split(/\s+/)
    .filter(Boolean)
  const types = filters.types ?? []
  const services = filters.services ?? []

  return branches.filter((branch) => {
    if (branch.status === 'permanently-closed') return false
    if (types.length > 0 && !types.includes(branch.type)) return false
    if (filters.province && branch.province !== filters.province) return false
    if (services.length > 0 && !branch.services.some((service) => services.includes(service))) return false

    if (words.length > 0) {
      const text = searchableText(branch)
      if (!words.every((word) => text.includes(word))) return false
    }

    if (filters.openNow) {
      const { kind } = getOpenStatus(branch, now)
      if (kind !== 'open' && kind !== 'closing-soon') return false
    }

    return true
  })
}
