import type { BranchType } from '../types'

const TYPE_LABELS: Record<BranchType, string> = {
  branch: 'Branch',
  atm: 'ATM',
  'business-centre': 'Business centre',
}

/** What a kind of site is called on screen. */
export function typeLabel(type: BranchType): string {
  return TYPE_LABELS[type]
}
