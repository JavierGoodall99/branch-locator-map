import { useEffect, useRef } from 'react'
import { listBranches } from '../lib/listing'
import type { Coordinates } from '../types'
import { toBranchFilters, type LocatorFilters } from '../model/filters'
import type { UseBranchesResult } from '../model/useBranches'
import { BranchDetail } from './BranchDetail'
import { BranchResults } from './BranchResults'

interface ResultsPanelProps {
  state: UseBranchesResult
  filters: LocatorFilters
  now: Date
  /** The user's location, if known. */
  origin: Coordinates | null
  /** The branch being viewed in detail, or null for the list. */
  selectedId: string | null
  onSelect: (id: string | null) => void
  onClearFilters: () => void
}

/** Shows the results list, or one branch in detail, and keeps keyboard focus sensible between them. */
export function ResultsPanel({ state, filters, now, origin, selectedId, onSelect, onClearFilters }: ResultsPanelProps) {
  // The list is only worked out here while a branch is open, to find it. In list mode BranchResults
  // does that work itself.
  const visible =
    selectedId && state.status === 'success' ? listBranches(state.branches, toBranchFilters(filters), now, origin, filters.radiusKm) : []
  const selected = selectedId ? (visible.find((branch) => branch.id === selectedId) ?? null) : null

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
        now={now}
        distanceKm={selected.distanceKm}
        onBack={() => onSelect(null)}
      />
    )
  }

  return (
    <BranchResults
      state={state}
      filters={filters}
      now={now}
      origin={origin}
      onClearFilters={onClearFilters}
      onSelect={onSelect}
    />
  )
}
