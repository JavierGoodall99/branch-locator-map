import { useState } from 'react'
import { LazyBranchMap } from './features/branches/components/LazyBranchMap'
import { LocatorControls } from './features/branches/components/LocatorControls'
import { LocatorLayout } from './features/branches/components/LocatorLayout'
import { ResultsPanel } from './features/branches/components/ResultsPanel'
import { listBranches } from './features/branches/lib/listing'
import {
  DEFAULT_FILTERS,
  clearFilters,
  toBranchFilters,
  type LocatorFilters,
} from './features/branches/model/filters'
import { useBranches } from './features/branches/model/useBranches'
import { useLocation } from './features/branches/model/useLocation'
import { useNow } from './shared/hooks/useNow'

function App() {
  const branches = useBranches()
  const now = useNow()
  const location = useLocation()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Changing the search or filters means the user wants a list again, so leave the detail view.
  const changeFilters = (next: LocatorFilters) => {
    setFilters(next)
    setSelectedId(null)
  }

  // Choosing a branch from the search suggestions opens it. The search becomes its name and the
  // switch moves to its kind, so it is certain to be in the list that Previous and Next walk.
  const openBranch = (id: string) => {
    const branch = branches.status === 'success' ? branches.branches.find((item) => item.id === id) : undefined
    if (!branch) return
    setFilters((current) => ({ ...current, query: branch.name, show: branch.type === 'atm' ? 'atms' : 'branches' }))
    setSelectedId(id)
  }

  // The user's position, once they have shared it.
  const origin = location.status === 'located' ? location.position : null

  // The same list the results panel shows, so the map and the list never disagree.
  const visible =
    branches.status === 'success' ? listBranches(branches.branches, toBranchFilters(filters), now, origin) : []

  return (
    <LocatorLayout
      controls={
        <LocatorControls
          filters={filters}
          onChange={changeFilters}
          location={location}
          branches={branches.status === 'success' ? branches.branches : []}
          onPickBranch={openBranch}
        />
      }
      results={
        <ResultsPanel
          state={branches}
          filters={filters}
          now={now}
          origin={origin}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClearFilters={() => changeFilters(clearFilters(filters))}
        />
      }
      map={<LazyBranchMap branches={visible} selectedId={selectedId} userLocation={origin} onSelect={setSelectedId} />}
    />
  )
}

export default App
