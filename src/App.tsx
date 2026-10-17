import { useEffect, useState } from 'react'
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

  // The page asks for the user's location as soon as it opens, so the list can start with what is
  // near them. If they say no, or the browser cannot, the list stays by name and a note says so.
  const requestLocation = location.request
  useEffect(() => {
    requestLocation()
  }, [requestLocation])
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
    // Every other filter is cleared too, so the branch is certain to be in the list.
    setFilters((current) => ({
      ...clearFilters(current),
      query: branch.name,
      show: branch.type === 'atm' ? 'atms' : 'branches',
    }))
    setSelectedId(id)
  }

  // The user's position, once they have shared it.
  const origin = location.status === 'located' ? location.position : null

  // A distance is measured from the user, so it only counts while their location is known.
  const view = origin ? filters : { ...filters, radiusKm: null }

  // The same list the results panel shows, so the map and the list never disagree.
  const visible =
    branches.status === 'success' ? listBranches(branches.branches, toBranchFilters(view), now, origin, view.radiusKm, view.sort) : []

  // One branch is open, and it is in the list: its details take the whole sidebar.
  const detailOpen = selectedId !== null && visible.some((branch) => branch.id === selectedId)

  return (
    <LocatorLayout
      detailOpen={detailOpen}
      controls={
        <LocatorControls
          filters={view}
          onChange={changeFilters}
          location={location}
          branches={branches.status === 'success' ? branches.branches : []}
          onPickBranch={openBranch}
          countResults={(next) =>
            branches.status === 'success'
              ? listBranches(branches.branches, toBranchFilters(next), now, origin, next.radiusKm, next.sort).length
              : 0
          }
        />
      }
      results={
        <ResultsPanel
          state={branches}
          filters={view}
          now={now}
          origin={origin}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClearFilters={() => changeFilters(clearFilters(view))}
        />
      }
      map={<LazyBranchMap branches={visible} selectedId={selectedId} userLocation={origin} onSelect={setSelectedId} />}
    />
  )
}

export default App
