import { Suspense, lazy } from 'react'
import { MapLoading } from '@/features/branches/map/MapLoading'
import type { Branch, Coordinates } from '@/features/branches/types'

// The map library is large, so it loads on its own after the page is up. The results list works
// without it.
const BranchMap = lazy(() => import('./BranchMap').then((module) => ({ default: module.BranchMap })))

interface LazyBranchMapProps {
  branches: Branch[]
  selectedId: string | null
  hoveredId?: string | null
  userLocation?: Coordinates | null
  onSelect: (id: string) => void
}

export function LazyBranchMap(props: LazyBranchMapProps) {
  return (
    <Suspense fallback={<MapLoading />}>
      <BranchMap {...props} />
    </Suspense>
  )
}
