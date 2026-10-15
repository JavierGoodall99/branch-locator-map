import { useState } from 'react'
import { LocatorControls } from './features/branches/components/LocatorControls'
import { LocatorLayout } from './features/branches/components/LocatorLayout'
import { ResultsPanel } from './features/branches/components/ResultsPanel'
import { DEFAULT_FILTERS, clearFilters, type LocatorFilters } from './features/branches/model/filters'
import { useBranches } from './features/branches/model/useBranches'
import { useNow } from './shared/hooks/useNow'

function App() {
  const branches = useBranches()
  const now = useNow()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Changing the search or filters means the user wants a list again, so leave the detail view.
  const changeFilters = (next: LocatorFilters) => {
    setFilters(next)
    setSelectedId(null)
  }

  return (
    <LocatorLayout
      controls={<LocatorControls filters={filters} onChange={changeFilters} />}
      results={
        <ResultsPanel
          state={branches}
          filters={filters}
          now={now}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onClearFilters={() => changeFilters(clearFilters(filters))}
        />
      }
      map={null}
    />
  )
}

export default App
