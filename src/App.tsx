import { useState } from 'react'
import { BranchResults } from './features/branches/components/BranchResults'
import { LocatorControls } from './features/branches/components/LocatorControls'
import { LocatorLayout } from './features/branches/components/LocatorLayout'
import { DEFAULT_FILTERS, clearFilters } from './features/branches/model/filters'
import { useBranches } from './features/branches/model/useBranches'
import { useNow } from './shared/hooks/useNow'

function App() {
  const branches = useBranches()
  const now = useNow()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  return (
    <LocatorLayout
      controls={<LocatorControls filters={filters} onChange={setFilters} />}
      results={
        <BranchResults
          state={branches}
          filters={filters}
          now={now}
          onClearFilters={() => setFilters(clearFilters(filters))}
        />
      }
      map={null}
    />
  )
}

export default App
