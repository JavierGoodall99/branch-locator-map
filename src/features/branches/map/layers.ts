import type { ExpressionSpecification, Map as MapLibreMap, SymbolLayerSpecification } from 'maplibre-gl'
import { CLUSTER_MAX_ZOOM, HOVER_SOURCE_ID, LAYERS, PIN_IMAGES, SOURCE_ID, USER_LAYERS, USER_SOURCE_ID } from './config'
import { toFeatureCollection, userLocationCollection, type BranchFeatureCollection } from './geo'
import { pinTipOffset, type PinKind } from './pins'

export interface MapColors {
  primary: string
  strong: string
  deep: string
  ink: string
  white: string
  /** The light blue used behind the chosen ATM. */
  tint: string
  /** The "you are here" dot. A map convention, so it is not taken from the theme. */
  location: string
}

function cssVariable(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

/** Map colours come from the theme's CSS variables, so the map and the page never drift apart. */
export function readMapColors(): MapColors {
  return {
    primary: cssVariable('--bs-primary', '#2f6fed'),
    strong: cssVariable('--app-primary-strong', '#2259d0'),
    deep: cssVariable('--app-primary-deep', '#0033a0'),
    ink: '#000000',
    white: '#ffffff',
    tint: cssVariable('--app-primary-tint', '#cfdefb'),
    location: '#1a73e8',
  }
}

const isCluster: ExpressionSpecification = ['has', 'point_count']
const isBranchPin: ExpressionSpecification = ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'type'], 'atm']]
const isAtmPin: ExpressionSpecification = ['all', ['!', ['has', 'point_count']], ['==', ['get', 'type'], 'atm']]

/**
 * Layout for a pin layer. A branch pin is held by the tip of its tail, an ATM pin by its centre. Pins
 * may overlap and cover map labels, because hiding a branch to avoid a label would be worse.
 */
const pinLayout = (image: string, kind: PinKind): SymbolLayerSpecification['layout'] => ({
  'icon-image': image,
  'icon-anchor': kind === 'atm' || kind === 'selectedAtm' ? 'center' : 'bottom',
  'icon-offset': [0, pinTipOffset(kind)],
  'icon-allow-overlap': true,
  'icon-ignore-placement': true,
})

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

  // Branches, ATMs and the chosen branch are pins, drawn as images (see pins.ts). They are allowed
  // to overlap and to cover map labels, because hiding a branch to avoid a label would be worse.

  map.addLayer({
    id: LAYERS.branches,
    type: 'symbol',
    source: SOURCE_ID,
    filter: isBranchPin,
    layout: pinLayout(PIN_IMAGES.branch, 'branch'),
  })

  map.addLayer({
    id: LAYERS.atms,
    type: 'symbol',
    source: SOURCE_ID,
    filter: isAtmPin,
    layout: pinLayout(PIN_IMAGES.atm, 'atm'),
  })

  // The chosen branch or ATM: a larger pin with a halo, on top of the rest. Their filters are set
  // when something is selected (see selectedFilters).
  const none = selectedFilters('')
  map.addLayer({
    id: LAYERS.selected,
    type: 'symbol',
    source: SOURCE_ID,
    filter: none.branch,
    layout: pinLayout(PIN_IMAGES.selected, 'selected'),
  })

  map.addLayer({
    id: LAYERS.selectedAtm,
    type: 'symbol',
    source: SOURCE_ID,
    filter: none.atm,
    layout: pinLayout(PIN_IMAGES.selectedAtm, 'selectedAtm'),
  })
}

/**
 * Adds the place under the pointer in the results list: the same larger pin as the chosen one, on its
 * own unclustered source so it shows even where the place is part of a cluster. It starts empty.
 */
export function addHoverLayers(map: Pick<MapLibreMap, 'addSource' | 'addLayer'>): void {
  map.addSource(HOVER_SOURCE_ID, { type: 'geojson', data: toFeatureCollection([]) })

  const isAtm: ExpressionSpecification = ['==', ['get', 'type'], 'atm']
  map.addLayer({
    id: LAYERS.hovered,
    type: 'symbol',
    source: HOVER_SOURCE_ID,
    filter: ['!', isAtm],
    layout: pinLayout(PIN_IMAGES.selected, 'selected'),
  })
  map.addLayer({
    id: LAYERS.hoveredAtm,
    type: 'symbol',
    source: HOVER_SOURCE_ID,
    filter: isAtm,
    layout: pinLayout(PIN_IMAGES.selectedAtm, 'selectedAtm'),
  })
}

/**
 * The filters for the two "chosen" layers. A branch and an ATM are different pins, so each layer must
 * only show its own kind. Pass an empty id to show neither.
 */
export function selectedFilters(id: string): { branch: ExpressionSpecification; atm: ExpressionSpecification } {
  const isChosen: ExpressionSpecification = ['==', ['get', 'id'], id]
  return {
    branch: ['all', isChosen, ['!=', ['get', 'type'], 'atm']],
    atm: ['all', isChosen, ['==', ['get', 'type'], 'atm']],
  }
}

/** Adds the user's own position: the familiar blue dot with a white ring and a pale halo. */
export function addUserLocationLayers(map: Pick<MapLibreMap, 'addSource' | 'addLayer'>, colors: MapColors): void {
  map.addSource(USER_SOURCE_ID, { type: 'geojson', data: userLocationCollection(null) })

  map.addLayer({
    id: USER_LAYERS.halo,
    type: 'circle',
    source: USER_SOURCE_ID,
    paint: { 'circle-radius': 24, 'circle-color': colors.location, 'circle-opacity': 0.2 },
  })
  map.addLayer({
    id: USER_LAYERS.dot,
    type: 'circle',
    source: USER_SOURCE_ID,
    paint: {
      'circle-radius': 8,
      'circle-color': colors.location,
      'circle-stroke-width': 3,
      'circle-stroke-color': colors.white,
    },
  })
}
