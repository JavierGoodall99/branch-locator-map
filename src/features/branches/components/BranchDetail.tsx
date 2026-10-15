import { useEffect, useRef } from 'react'
import { Icon } from '../../../shared/ui/Icon'
import { formatDistance } from '../lib/distance'
import { formatOpeningHours, getOpenStatus } from '../lib/hours'
import { directionsUrl, telUrl } from '../lib/links'
import type { Branch } from '../types'
import { ServiceList } from './ServiceList'
import { StatusChip } from './StatusChip'

interface BranchDetailProps {
  branch: Branch
  /** 1-based position in the list the user came from. */
  position: number
  total: number
  now: Date
  /** Distance from the user, when their location is known. */
  distanceKm?: number
  onBack: () => void
  onPrevious: () => void
  onNext: () => void
}

/** Everything we know about one branch, with a way back and Previous and Next. */
export function BranchDetail({ branch, position, total, now, distanceKm, onBack, onPrevious, onNext }: BranchDetailProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Opening the detail view moves focus to its heading, so keyboard and screen reader users
  // land on the new content instead of on a button that no longer exists.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <article className="branch-detail">
      <div className="branch-detail__nav">
        <button type="button" className="btn btn-link btn-sm ps-0" onClick={onBack}>
          <Icon name="chevronLeft" />
          Back to results
        </button>
        <div className="branch-detail__pager">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous branch"
            disabled={position <= 1}
            onClick={onPrevious}
          >
            <Icon name="chevronLeft" />
          </button>
          <span className="branch-detail__position" aria-hidden="true">
            {position} of {total}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Next branch"
            disabled={position >= total}
            onClick={onNext}
          >
            <Icon name="chevronRight" />
          </button>
        </div>
      </div>

      {/* Announces the new branch when Previous or Next is pressed. */}
      <p className="visually-hidden" role="status">
        {branch.name}, {position} of {total}
      </p>

      <h1 className="h3 m-0" ref={headingRef} tabIndex={-1}>
        {branch.name}
      </h1>

      <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
        <StatusChip status={getOpenStatus(branch, now)} />
        {distanceKm !== undefined && (
          <span className="branch-detail__distance">{formatDistance(distanceKm)} away</span>
        )}
        <span className="sample-badge">Sample data</span>
      </div>

      <div className="branch-card__actions">
        <a
          className="btn btn-primary btn-sm flex-grow-1"
          href={directionsUrl(branch.location)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Icon name="navigation" />
          Directions{' '}
          <span className="visually-hidden">(opens in a new tab)</span>
        </a>
        {branch.phone && (
          <a className="btn btn-link btn-sm" href={telUrl(branch.phone)}>
            <Icon name="phone" />
            Call
          </a>
        )}
      </div>

      <section className="branch-detail__section" aria-labelledby="detail-address">
        <h2 className="h4" id="detail-address">
          Address
        </h2>
        <p>{branch.address}</p>
        {branch.phone && (
          <p>
            <a href={telUrl(branch.phone)}>{branch.phone}</a>
          </p>
        )}
      </section>

      <section className="branch-detail__section" aria-labelledby="detail-hours">
        <h2 className="h4" id="detail-hours">
          Opening hours
        </h2>
        <p className="tabular-nums">{formatOpeningHours(branch)}</p>
        <p className="branch-detail__note">Hours can differ on public holidays, so check before you travel.</p>
      </section>

      <section className="branch-detail__section" aria-labelledby="detail-services">
        <h2 className="h4" id="detail-services">
          Services
        </h2>
        <ServiceList services={branch.services} />
      </section>
    </article>
  )
}
