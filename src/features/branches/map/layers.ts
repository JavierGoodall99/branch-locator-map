import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl'
import { CLUSTER_MAX_ZOOM, LAYERS, SOURCE_ID, USER_LAYERS, USER_SOURCE_ID } from './config'
import { userLocationCollection, type BranchFeatureCollection } from './geo'

export interface MapColors {
  primary: string
  strong: string
  deep: string
  ink: string
  white: string
}

function cssVariable(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/** Map colours come from the theme's CSS variables, so the map and the page never drift apart. */
export function readMapColors(): MapColors {
  return {
    primary: cssVariable('--bs-primary', '#2f70ef'),
    strong: cssVariable('--app-primary-strong', '#2259d0'),
    deep: cssVariable('--app-primary-deep', '#0033a0'),
    ink: '#000000',
    white: '#ffffff',
  }
}

const isCluster: ExpressionSpecification = ['has', 'point_count']
const isBranchPin: ExpressionSpecification = [
  'all',
  ['!', ['has', 'point_count']],
  ['!=', ['get', 'type'], 'atm'],
]
const isAtmPin: ExpressionSpecification = [
  'all',
  ['!', ['has', 'point_count']],
  ['==', ['get', 'type'], 'atm'],
]

/** Adds the branch source and its layers. Clusters merge nearby pins; ATMs and branches differ in shape. */
export function addBranchLayers(
  map: Pick<MapLibreMap, 'addSource' | 'addLayer'>,
  data: BranchFeatureCollection,
  colors: MapColors,
): void {
  map.addSource(SOURCE_ID, {
    type: 'geojson',
    data,
    cluster: true,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    clusterRadius: 48,
  })

  // Group: a dark numbered disc.
  map.addLayer({
    id: LAYERS.clusters,
    type: 'circle',
    source: SOURCE_ID,
    filter: isCluster,
    paint: {
      'circle-color': colors.deep,
      'circle-radius': ['step', ['get', 'point_count'], 18, 10, 22, 50, 28],
      'circle-stroke-width': 3,
      'circle-stroke-color': colors.white,
    },
  })
  map.addLayer({
    id: LAYERS.clusterCount,
    type: 'symbol',
    source: SOURCE_ID,
    filter: isCluster,
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-font': ['Noto Sans Bold'],
      'text-size': 14,
      'text-allow-overlap': true,
    },
    paint: { 'text-color': colors.white },
  })

  // Branch: a solid brand-blue dot with a white edge.
  map.addLayer({
    id: LAYERS.branches,
    type: 'circle',
    source: SOURCE_ID,
    filter: isBranchPin,
    paint: {
      'circle-color': colors.primary,
      'circle-radius': 10,
      'circle-stroke-width': 2.5,
      'circle-stroke-color': colors.white,
    },
  })

  // ATM: a white dot with a dark ring. Fill and ring tell it from a branch, so colour is not the only cue.
  map.addLayer({
    id: LAYERS.atms,
    type: 'circle',
    source: SOURCE_ID,
    filter: isAtmPin,
    paint: {
      'circle-color': colors.white,
      'circle-radius': 8,
      'circle-stroke-width': 3,
      'circle-stroke-color': colors.deep,
    },
  })

  // The chosen branch: larger, with a black ring. Its filter is set when a branch is selected.
  map.addLayer({
    id: LAYERS.selected,
    type: 'circle',
    source: SOURCE_ID,
    filter: ['==', ['get', 'id'], ''],
    paint: {
      'circle-color': colors.strong,
      'circle-radius': 15,
      'circle-stroke-width': 4,
      'circle-stroke-color': colors.ink,
    },
  })
}

/** Adds the user's own position: a dark dot with a pale halo, unlike any branch or ATM pin. */
export function addUserLocationLayers(map: Pick<MapLibreMap, 'addSource' | 'addLayer'>, colors: MapColors): void {
  map.addSource(USER_SOURCE_ID, { type: 'geojson', data: userLocationCollection(null) })

  map.addLayer({
    id: USER_LAYERS.halo,
    type: 'circle',
    source: USER_SOURCE_ID,
    paint: { 'circle-radius': 20, 'circle-color': colors.ink, 'circle-opacity': 0.15 },
  })
  map.addLayer({
    id: USER_LAYERS.dot,
    type: 'circle',
    source: USER_SOURCE_ID,
    paint: {
      'circle-radius': 7,
      'circle-color': colors.ink,
      'circle-stroke-width': 3,
      'circle-stroke-color': colors.white,
    },
  })
}
