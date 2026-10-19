import { useEffect, useRef } from 'react'
import { Icon } from '@/shared/ui/Icon'
import { formatDistance } from '@/features/branches/lib/distance'
import { formatOpeningHours, getOpenStatus } from '@/features/branches/lib/hours'
import { directionsUrl, telUrl } from '@/features/branches/lib/links'
import type { Branch } from '@/features/branches/types'
import { DetailHero } from './DetailHero'
import { ServiceList } from '@/features/branches/components/common/ServiceList'
import { StatusChip } from '@/features/branches/components/common/StatusChip'
import { TypeBadge } from '@/features/branches/components/common/TypeBadge'

interface BranchDetailProps {
  branch: Branch
  now: Date
  /** Distance from the user, when their location is known. */
  distanceKm?: number
  onBack: () => void
}

/** Everything we know about one branch, with a way back to the list. */
export function BranchDetail({ branch, now, distanceKm, onBack }: BranchDetailProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Opening the detail view moves focus to its heading, so keyboard and screen reader users
  // land on the new content instead of on a button that no longer exists.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <article className="branch-detail">
      <DetailHero onBack={onBack} />

      <div className="branch-detail__summary">
        <div className="branch-detail__identity">
          <TypeBadge type={branch.type} />
          <div className="branch-detail__title">
            <h1 className="h4 m-0" ref={headingRef} tabIndex={-1}>
              {branch.name}
            </h1>
            <p className="branch-detail__address">{branch.address}</p>
          </div>
          {distanceKm !== undefined && (
            <p className="branch-detail__distance">
              {formatDistance(distanceKm)}
              <span className="visually-hidden"> away</span>
            </p>
          )}
        </div>

        <StatusChip status={getOpenStatus(branch, now)} />

        <div className="branch-detail__actions">
          <a
            className="btn btn-primary flex-grow-1"
            href={directionsUrl(branch.location)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="navigation" />
            Get directions <span className="visually-hidden">(opens in a new tab)</span>
          </a>
          {branch.phone && (
            <a className="btn btn-link" href={telUrl(branch.phone)}>
              <Icon name="phone" />
              Call
              <span className="visually-hidden"> {branch.name}</span>
            </a>
          )}
        </div>
      </div>

      <div className="branch-detail__body">
        <section className="branch-detail__section" aria-labelledby="detail-hours">
          <h2 className="h5" id="detail-hours">
            Opening hours
          </h2>
          <p className="tabular-nums">{formatOpeningHours(branch)}</p>
          <p className="branch-detail__note">Hours can differ on public holidays.</p>
        </section>

        <section className="branch-detail__section" aria-labelledby="detail-services">
          <h2 className="h5" id="detail-services">
            Services
          </h2>
          <ServiceList services={branch.services} />
        </section>
      </div>
    </article>
  )
}
