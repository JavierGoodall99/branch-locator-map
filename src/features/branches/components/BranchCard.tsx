import { Fragment } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { formatDistance } from '../lib/distance'
import { getOpenStatus } from '../lib/hours'
import { typeLabel } from '../lib/labels'
import { directionsUrl, telUrl } from '../lib/links'
import { localityOf } from '../lib/place'
import type { Branch } from '../types'
import { ServiceList } from './ServiceList'
import { StatusChip } from './StatusChip'
import { TypeBadge } from './TypeBadge'

interface BranchCardProps {
  branch: Branch
  now: Date
  /** Distance from the user, when their location is known. */
  distanceKm?: number
  onSelect: (id: string) => void
}

// The whole card opens the details (see the name button below). Directions and Call sit above that
// and stay separate controls. Links are plain anchors with Bootstrap's button classes:
// react-bootstrap's Button gives anchors role="button", which is wrong for navigation.
export function BranchCard({ branch, now, distanceKm, onSelect }: BranchCardProps) {
  const headingId = `branch-${branch.id}`
  const status = getOpenStatus(branch, now)
  // For example "Branch · 3,0 km away · Wynberg". The distance is only there once the location is known.
  const meta = [
    typeLabel(branch.type),
    ...(distanceKm !== undefined ? [`${formatDistance(distanceKm)} away`] : []),
    localityOf(branch),
  ]

  return (
    <article className="branch-card" aria-labelledby={headingId}>
      <div className="branch-card__header">
        <TypeBadge type={branch.type} />
        <div className="branch-card__heading">
          <h2 className="h4 m-0" id={headingId}>
            {/* The name is the card's button. CSS stretches it over the whole card, so a click anywhere
                opens the details, while keyboard and screen reader users get a single stop. */}
            <button
              type="button"
              id={`details-${branch.id}`}
              className="branch-card__open"
              onClick={() => onSelect(branch.id)}
            >
              {branch.name}
            </button>
          </h2>
          <p className="branch-card__meta">
            {meta.map((part, index) => (
              <Fragment key={part}>
                {/* The dot is for the eye; screen readers hear a comma instead. */}
                {index > 0 && <span aria-hidden="true"> · </span>}
                {index > 0 && <span className="visually-hidden">, </span>}
                <span>{part}</span>
              </Fragment>
            ))}
          </p>
        </div>
      </div>
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
