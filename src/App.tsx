import { BranchResults } from './features/branches/components/BranchResults'
import { LocatorLayout } from './features/branches/components/LocatorLayout'
import { useBranches } from './features/branches/model/useBranches'
import { useNow } from './shared/hooks/useNow'

function App() {
  const branches = useBranches()
  const now = useNow()

  return (
    <LocatorLayout
      controls={
        <div>
          <p className="h4 m-0 brand">Capitec</p>
          <p className="small text-body-secondary m-0">Find a branch or ATM</p>
        </div>
      }
      results={<BranchResults state={branches} now={now} />}
      map={null}
    />
  )
}

export default App
