import { Button } from 'react-bootstrap'
import { listBranches } from '../lib/listing'
import { hasActiveFilters, toBranchFilters, type LocatorFilters } from '../model/filters'
import type { UseBranchesResult } from '../model/useBranches'
import { BranchCard } from './BranchCard'

interface BranchResultsProps {
  state: UseBranchesResult
  filters: LocatorFilters
  now: Date
  onClearFilters: () => void
  onSelect: (id: string) => void
}

function countLabel(state: UseBranchesResult, shown: number): string {
  if (state.status === 'loading') return 'Loading branches'
  if (state.status === 'error') return ''
  return `${shown} ${shown === 1 ? 'location' : 'locations'}, sorted by name`
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
export function BranchResults({ state, filters, now, onClearFilters, onSelect }: BranchResultsProps) {
  const branches =
    state.status === 'success'
      ? listBranches(state.branches, toBranchFilters(filters), now)
      : []

  return (
    <>
      <div className="results-header">
        <div>
          <h1 className="h4 m-0">Branches and ATMs</h1>
          <p className="results-header__count" role="status">
            {countLabel(state, branches.length)}
          </p>
        </div>
        <span className="sample-badge">Sample data</span>
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
              <p>Try a different search, or clear your filters to see everything.</p>
              <Button onClick={onClearFilters}>Clear filters</Button>
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
              <BranchCard branch={branch} now={now} onSelect={onSelect} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
