import { Fragment } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { formatDistance } from '@/features/branches/lib/distance'
import { getOpenStatus } from '@/features/branches/lib/hours'
import { typeLabel } from '@/features/branches/lib/labels'
import { directionsUrl, telUrl } from '@/features/branches/lib/links'
import { localityOf } from '@/features/branches/lib/place'
import type { Branch } from '@/features/branches/types'
import { ServiceList } from './ServiceList'
import { StatusChip } from './StatusChip'
import { TypeBadge } from './TypeBadge'

interface BranchCardProps {
  branch: Branch
  now: Date
  /** Distance from the user, when their location is known. */
  distanceKm?: number
  onSelect: (id: string) => void
  /** Called with this card's id when the pointer is over it or it has the keyboard, and with null when that ends. */
  onHover?: (id: string | null) => void
}

// The whole card opens the details (see the name button below). Directions and Call sit above that
// and stay separate controls. Links are plain anchors with Bootstrap's button classes:
// react-bootstrap's Button gives anchors role="button", which is wrong for navigation.
export function BranchCard({ branch, now, distanceKm, onSelect, onHover }: BranchCardProps) {
  const headingId = `branch-${branch.id}`
  const status = getOpenStatus(branch, now)
  // For example "Branch · 3,0 km away · Wynberg". The distance is only there once the location is known.
  const meta = [
    typeLabel(branch.type),
    ...(distanceKm !== undefined ? [`${formatDistance(distanceKm)} away`] : []),
    localityOf(branch),
  ]

  return (
    // These handlers only highlight this place on the map, they do not act, and the keyboard does the
    // same through focus; every action on the card is a real button or link.
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      className="branch-card"
      aria-labelledby={headingId}
      // The map shows which place this is. Keyboard focus does the same as the pointer, so the two match.
      onMouseEnter={() => onHover?.(branch.id)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(branch.id)}
      onBlur={(event) => {
        // Moving between this card's own buttons and links is not leaving it.
        if (!event.currentTarget.contains(event.relatedTarget)) onHover?.(null)
      }}
    >
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
          Directions <span className="visually-hidden">to {branch.name} (opens in a new tab)</span>
        </a>
        {branch.phone && (
          <a className="btn btn-link btn-sm" href={telUrl(branch.phone)}>
            <Icon name="phone" />
            Call <span className="visually-hidden">{branch.name}</span>
          </a>
        )}
      </div>
    </article>
  )
}
