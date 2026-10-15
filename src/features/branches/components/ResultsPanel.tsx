import { useEffect, useRef } from 'react'
import { listBranches } from '../lib/listing'
import { toBranchFilters, type LocatorFilters } from '../model/filters'
import type { UseBranchesResult } from '../model/useBranches'
import { BranchDetail } from './BranchDetail'
import { BranchResults } from './BranchResults'

interface ResultsPanelProps {
  state: UseBranchesResult
  filters: LocatorFilters
  now: Date
  /** The branch being viewed in detail, or null for the list. */
  selectedId: string | null
  onSelect: (id: string | null) => void
  onClearFilters: () => void
}

/** Shows the results list, or one branch in detail, and keeps keyboard focus sensible between them. */
export function ResultsPanel({ state, filters, now, selectedId, onSelect, onClearFilters }: ResultsPanelProps) {
  // The list is only worked out here while a branch is open, so Previous and Next walk the
  // same list the user came from. In list mode BranchResults does that work itself.
  const visible =
    selectedId && state.status === 'success' ? listBranches(state.branches, toBranchFilters(filters), now) : []
  const index = selectedId ? visible.findIndex((branch) => branch.id === selectedId) : -1
  const selected = index >= 0 ? visible[index] : null

  // When the user goes back, return focus to the Details button of the branch they were last
  // viewing, so they are not dropped at the top of the page.
  const viewedId = selected?.id ?? null
  const previousViewedId = useRef<string | null>(null)

  useEffect(() => {
    if (viewedId === null && previousViewedId.current !== null) {
      document.getElementById(`details-${previousViewedId.current}`)?.focus()
    }
    previousViewedId.current = viewedId
  }, [viewedId])

  if (selected) {
    return (
      <BranchDetail
        branch={selected}
        position={index + 1}
        total={visible.length}
        now={now}
        onBack={() => onSelect(null)}
        onPrevious={() => onSelect(visible[index - 1].id)}
        onNext={() => onSelect(visible[index + 1].id)}
      />
    )
  }

  return (
    <BranchResults state={state} filters={filters} now={now} onClearFilters={onClearFilters} onSelect={onSelect} />
  )
}
