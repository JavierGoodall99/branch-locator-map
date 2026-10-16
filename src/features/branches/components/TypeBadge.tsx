import { Icon } from '../../../shared/ui/Icon'
import type { BranchType } from '../types'

/**
 * The badge that shows what kind of site this is: a blue square with a building for a branch, and a
 * white circle with a ring and a card for an ATM. The shape differs as well as the fill, so the two
 * never rely on colour alone. It is decoration; the kind is also written out next to it.
 */
export function TypeBadge({ type }: { type: BranchType }) {
  const isAtm = type === 'atm'
  return (
    <span className={`type-badge type-badge--${isAtm ? 'atm' : 'branch'}`} aria-hidden="true">
      <Icon name={isAtm ? 'cash' : 'bank'} size={isAtm ? 18 : 20} />
    </span>
  )
}
