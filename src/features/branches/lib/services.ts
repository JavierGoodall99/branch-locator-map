import type { Branch, BranchType } from '@/features/branches/types'
import { typeLabel } from './labels'
import { normalise } from './filterBranches'

const TYPES: BranchType[] = ['branch', 'atm', 'business-centre']

/**
 * The services a user can filter by, from the data, in alphabetical order. A service that only
 * repeats the kind of site ("Branch", "ATM") is left out, because the Show switch already does that.
 */
export function serviceOptions(branches: Branch[]): string[] {
  const kinds = new Set(TYPES.map((type) => normalise(typeLabel(type))))
  const services = new Set(branches.flatMap((branch) => branch.services))
  return [...services].filter((service) => !kinds.has(normalise(service))).sort((a, b) => a.localeCompare(b))
}
