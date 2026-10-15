import { Suspense, lazy } from 'react'
import type { Branch, Coordinates } from '../types'

// The map library is large, so it loads on its own after the page is up. The results list works
// without it.
const BranchMap = lazy(() => import('./BranchMap').then((module) => ({ default: module.BranchMap })))

interface LazyBranchMapProps {
  branches: Branch[]
  selectedId: string | null
  userLocation?: Coordinates | null
  onSelect: (id: string) => void
}

export function LazyBranchMap(props: LazyBranchMapProps) {
  return (
    <Suspense
      fallback={
        <p className="map-status" role="status">
          Loading map…
        </p>
      }
    >
      <BranchMap {...props} />
    </Suspense>
  )
}
