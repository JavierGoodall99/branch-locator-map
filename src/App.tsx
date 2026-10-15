import { LocatorLayout } from './features/branches/components/LocatorLayout'

function App() {
  return (
    <LocatorLayout
      controls={<p className="small text-body-secondary m-0">Search and filters</p>}
      results={<h1 className="h4">Branches and ATMs</h1>}
      map={null}
    />
  )
}

export default App
