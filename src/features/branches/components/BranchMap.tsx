import { Map as MapLibreMap, NavigationControl, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import { useEffect, useRef, useState } from 'react'
import {
  HOVER_SOURCE_ID,
  LAYERS,
  MAP_STYLE_URL,
  NEAREST_TO_SHOW,
  SELECTED_ZOOM,
  SOURCE_ID,
  USER_SOURCE_ID,
} from '../map/config'
import {
  SOUTH_AFRICA_BOUNDS,
  boundsFor,
  boundsOfPoints,
  idsKey,
  toFeatureCollection,
  userLocationCollection,
} from '../map/geo'
import { addBranchLayers, addHoverLayers, addUserLocationLayers, readMapColors, selectedFilters } from '../map/layers'
import { applyBasemapLook } from '../map/basemap'
import { addPinImages } from '../map/pins'
import { isWideLayout, motionDuration, viewPadding } from '../map/view'
import { isWebGLAvailable } from '../map/webgl'
import type { Branch, Coordinates } from '../types'

// MapLibre finds its worker file relative to itself, which breaks once a bundler moves the
// library. Point it at the worker explicitly, using the URL the bundler gives us.
setWorkerUrl(workerUrl)

interface BranchMapProps {
  /** The branches to show: the same filtered list the results panel shows. */
  branches: Branch[]
  selectedId: string | null
  /** The place under the pointer, or focused, in the results list. It is highlighted on the map, not moved to. */
  hoveredId?: string | null
  /** The user's position, once they have shared it. It is drawn as a dot and framed with the nearest branches. */
  userLocation?: Coordinates | null
  onSelect: (id: string) => void
}

type MapStatus = 'loading' | 'ready' | 'failed'

/**
 * The map. It is a supplement to the results list, which stays the complete, accessible way to
 * use the page: pins are not keyboard focusable, but every pin's branch is in the list.
 */
export function BranchMap({ branches, selectedId, hoveredId, userLocation, onSelect }: BranchMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const appliedKey = useRef<string | null>(null)
  const [webglAvailable] = useState(isWebGLAvailable)
  const [status, setStatus] = useState<MapStatus>('loading')
  const [attempt, setAttempt] = useState(0)

  // Event handlers are registered once, so they read the latest props through this ref.
  const latest = useRef({ branches, onSelect })
  useEffect(() => {
    latest.current = { branches, onSelect }
  })

  useEffect(() => {
    const container = containerRef.current
    if (!webglAvailable || !container) return

    const map = new MapLibreMap({
      container,
      style: MAP_STYLE_URL,
      bounds: SOUTH_AFRICA_BOUNDS,
      fitBoundsOptions: { padding: 24 },
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    })
    map.touchZoomRotate.disableRotation()
    map.addControl(new NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map

    let loaded = false

    map.on('load', () => {
      loaded = true
      const colors = readMapColors()
      // Recolour the base map first, so our own layers are never touched by it.
      applyBasemapLook(map)
      addPinImages(map, colors)
      addBranchLayers(map, toFeatureCollection(latest.current.branches), colors)
      addHoverLayers(map)
      addUserLocationLayers(map, colors)

      map.on('click', LAYERS.clusters, async (event) => {
        const cluster = event.features?.[0]
        if (!cluster || cluster.geometry.type !== 'Point') return
        const source = map.getSource(SOURCE_ID) as GeoJSONSource
        const zoom = await source.getClusterExpansionZoom(Number(cluster.properties.cluster_id))
        map.easeTo({
          center: cluster.geometry.coordinates as [number, number],
          zoom,
          duration: motionDuration(),
        })
      })

      for (const layer of [LAYERS.branches, LAYERS.atms]) {
        map.on('click', layer, (event) => {
          const id = event.features?.[0]?.properties?.id
          if (typeof id === 'string') latest.current.onSelect(id)
        })
      }
      for (const layer of [LAYERS.clusters, LAYERS.branches, LAYERS.atms]) {
        map.on('mouseenter', layer, () => (map.getCanvas().style.cursor = 'pointer'))
        map.on('mouseleave', layer, () => (map.getCanvas().style.cursor = ''))
      }

      setStatus('ready')
    })

    // After load, a single missing tile is not worth blocking the page for; before it, the map
    // has no style at all, so say so.
    map.on('error', () => {
      if (!loaded) setStatus('failed')
    })

    return () => {
      map.remove()
      mapRef.current = null
      appliedKey.current = null
    }
  }, [attempt, webglAvailable])

  // Show the current branches, and move the map only when the set of branches changes.
  const key = idsKey(branches)
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map || appliedKey.current === key) return
    appliedKey.current = key

    ;(map.getSource(SOURCE_ID) as GeoJSONSource).setData(toFeatureCollection(branches))
    const bounds = boundsFor(branches)
    if (bounds) {
      map.fitBounds(bounds, {
        padding: viewPadding(isWideLayout(), map.getContainer().clientHeight),
        maxZoom: SELECTED_ZOOM,
        duration: motionDuration(),
      })
    }
  }, [branches, key, status])

  // Draw the user's own position, and frame it together with the nearest branches. The branches
  // arrive nearest first once the user has shared a location.
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return

    ;(map.getSource(USER_SOURCE_ID) as GeoJSONSource).setData(userLocationCollection(userLocation ?? null))
    if (!userLocation) return

    const nearest = latest.current.branches.slice(0, NEAREST_TO_SHOW).map((branch) => branch.location)
    const bounds = boundsOfPoints([userLocation, ...nearest])
    if (bounds) {
      map.fitBounds(bounds, {
        padding: viewPadding(isWideLayout(), map.getContainer().clientHeight),
        maxZoom: SELECTED_ZOOM,
        duration: motionDuration(),
      })
    }
  }, [userLocation, status])

  // Highlight the chosen branch and bring it into view.
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return

    const chosen = selectedFilters(selectedId ?? '')
    map.setFilter(LAYERS.selected, chosen.branch)
    map.setFilter(LAYERS.selectedAtm, chosen.atm)
    const branch = selectedId ? latest.current.branches.find((item) => item.id === selectedId) : undefined
    if (branch) {
      map.easeTo({
        center: [branch.location.lng, branch.location.lat],
        zoom: Math.max(map.getZoom(), SELECTED_ZOOM),
        padding: viewPadding(isWideLayout(), map.getContainer().clientHeight),
        duration: motionDuration(),
      })
    }
  }, [selectedId, status])

  // Show the place under the pointer in the list. The chosen place already has its own pin, so it is
  // not drawn twice. The map does not move, because it would jump with every card the pointer crosses.
  useEffect(() => {
    const map = mapRef.current
    if (status !== 'ready' || !map) return

    const hovered = hoveredId && hoveredId !== selectedId ? branches.find((item) => item.id === hoveredId) : undefined
    ;(map.getSource(HOVER_SOURCE_ID) as GeoJSONSource).setData(toFeatureCollection(hovered ? [hovered] : []))
  }, [hoveredId, selectedId, branches, status])

  const retry = () => {
    setStatus('loading')
    setAttempt((count) => count + 1)
  }

  return (
    <div className="branch-map">
      <div ref={containerRef} className="branch-map__canvas" />

      {!webglAvailable && (
        <p className="map-status" role="status">
          This browser can’t show the map. You can still use the list.
        </p>
      )}

      {webglAvailable && status === 'loading' && (
        <p className="map-status" role="status">
          Loading map…
        </p>
      )}

      {webglAvailable && status === 'failed' && (
        <div className="map-status" role="alert">
          <p className="mb-2">The map couldn’t load. You can still use the list.</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={retry}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
