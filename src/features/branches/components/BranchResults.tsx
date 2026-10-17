import { Button } from 'react-bootstrap'
import { listBranches } from '../lib/listing'
import { hasActiveFilters, hasChosenFilters, toBranchFilters, type LocatorFilters } from '../model/filters'
import type { UseBranchesResult } from '../model/useBranches'
import type { Coordinates } from '../types'
import { BranchCard } from './BranchCard'

interface BranchResultsProps {
  state: UseBranchesResult
  filters: LocatorFilters
  now: Date
  /** The user's location, if known: the list is then nearest first, with distances. */
  origin?: Coordinates | null
  onClearFilters: () => void
  onSelect: (id: string) => void
}

function countLabel(state: UseBranchesResult, shown: number, nearestFirst: boolean, radiusKm: number | null): string {
  if (state.status === 'loading') return 'Loading branches'
  if (state.status === 'error') return ''
  const within = radiusKm === null ? '' : ` within ${radiusKm} km`
  return `${shown} ${shown === 1 ? 'location' : 'locations'}${within}, ${nearestFirst ? 'nearest first' : 'sorted by name'}`
}

function SkeletonList() {
  return (
    <ul className="results-list" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <li key={index}>
          <div className="branch-card">
            <div className="skeleton" style={{ height: 24, width: '70%' }} />
            <div className="skeleton" style={{ height: 16, width: '90%', marginTop: 8 }} />
            <div className="skeleton" style={{ height: 28, width: '45%', marginTop: 12 }} />
            <div className="skeleton" style={{ height: 44, marginTop: 16 }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** The results heading and list, covering loading, error, empty and loaded states. */
export function BranchResults({ state, filters, now, origin, onClearFilters, onSelect }: BranchResultsProps) {
  const branches =
    state.status === 'success'
      ? listBranches(state.branches, toBranchFilters(filters), now, origin, filters.radiusKm, filters.sort)
      : []

  return (
    <>
      {/* Not shown, but still the page heading and a live count for screen reader users. */}
      <div className="visually-hidden">
        <h1>Branches and ATMs</h1>
        <p role="status">{countLabel(state, branches.length, Boolean(origin) && filters.sort === 'distance', filters.radiusKm)}</p>
      </div>

      {state.status === 'loading' && <SkeletonList />}

      {state.status === 'error' && (
        <div className="results-message" role="alert">
          <h2 className="h4">We couldn’t load branches</h2>
          <p>{state.message}</p>
          <Button onClick={state.retry}>Try again</Button>
        </div>
      )}

      {state.status === 'success' && branches.length === 0 && (
        <div className="results-message">
          {hasActiveFilters(filters) ? (
            <>
              <h2 className="h4">No matches found</h2>
              <p>
                {hasChosenFilters(filters)
                  ? 'Try a different search or fewer filters, or clear them to see everything.'
                  : 'Try a different search, or clear it to see everything.'}
              </p>
              <Button onClick={onClearFilters}>{hasChosenFilters(filters) ? 'Clear filters' : 'Clear search'}</Button>
            </>
          ) : (
            <>
              <h2 className="h4">No branches to show</h2>
              <p>There is nothing of this kind in the data right now. Try Both to see branches and ATMs.</p>
            </>
          )}
        </div>
      )}

      {state.status === 'success' && branches.length > 0 && (
        <ul className="results-list">
          {branches.map((branch) => (
            <li key={branch.id}>
              <BranchCard branch={branch} now={now} distanceKm={branch.distanceKm} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
