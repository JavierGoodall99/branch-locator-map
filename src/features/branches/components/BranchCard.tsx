import { Icon } from '../../../shared/ui/Icon'
import { getOpenStatus } from '../lib/hours'
import { directionsUrl, telUrl } from '../lib/links'
import type { Branch } from '../types'
import { ServiceList } from './ServiceList'
import { StatusChip } from './StatusChip'

interface BranchCardProps {
  branch: Branch
  now: Date
  onSelect: (id: string) => void
}

// Links are plain anchors with Bootstrap's button classes: react-bootstrap's Button gives
// anchors role="button", which is wrong for navigation.
export function BranchCard({ branch, now, onSelect }: BranchCardProps) {
  const headingId = `branch-${branch.id}`
  const status = getOpenStatus(branch, now)

  return (
    <article className="branch-card" aria-labelledby={headingId}>
      <h2 className="h4 m-0" id={headingId}>
        {branch.name}
      </h2>
      <p className="branch-card__address">{branch.address}</p>
      <div className="mt-2">
        <StatusChip status={status} />
      </div>
      <ServiceList services={branch.services} />
      <div className="branch-card__actions">
        <a
          className="btn btn-primary btn-sm flex-grow-1"
          href={directionsUrl(branch.location)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="navigation" />
          Directions{' '}
          <span className="visually-hidden">to {branch.name} (opens in a new tab)</span>
        </a>
        <button
          type="button"
          id={`details-${branch.id}`}
          className="btn btn-link btn-sm"
          onClick={() => onSelect(branch.id)}
        >
          Details{' '}
          <span className="visually-hidden">for {branch.name}</span>
        </button>
        {branch.phone && (
          <a className="btn btn-link btn-sm" href={telUrl(branch.phone)}>
            <Icon name="phone" />
            Call{' '}
            <span className="visually-hidden">{branch.name}</span>
          </a>
        )}
      </div>
    </article>
  )
}
