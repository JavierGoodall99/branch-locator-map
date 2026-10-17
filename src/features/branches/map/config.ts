/**
 * OpenFreeMap's "liberty" style: no API key, and the closest free look to the maps people know,
 * with yellow main roads, green parks, blue water and road shields.
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export const SOURCE_ID = 'branches'

/** The one place under the pointer in the list, kept apart from the clustered source so it is never inside a cluster. */
export const HOVER_SOURCE_ID = 'hovered'

/** Names of the pin images drawn at startup (see pins.ts) and used by the pin layers. */
export const PIN_IMAGES = {
  branch: 'pin-branch',
  atm: 'pin-atm',
  selected: 'pin-selected',
  selectedAtm: 'pin-selected-atm',
} as const

export const LAYERS = {
  clusters: 'branch-clusters',
  clusterCount: 'branch-cluster-count',
  branches: 'branch-pins',
  atms: 'atm-pins',
  selected: 'branch-selected',
  selectedAtm: 'atm-selected',
  hovered: 'branch-hovered',
  hoveredAtm: 'atm-hovered',
} as const

/** Pins merge into numbered clusters at or below this zoom, and split apart above it. */
export const CLUSTER_MAX_ZOOM = 13

/** Zoom used when a branch is chosen, which is close enough that it is never inside a cluster. */
export const SELECTED_ZOOM = 14

/** The user's own position, drawn as a dot with a halo. */
export const USER_SOURCE_ID = 'user-location'
export const USER_LAYERS = { halo: 'user-halo', dot: 'user-dot' } as const

/** When the user shares their location, the map frames them together with this many nearest branches. */
export const NEAREST_TO_SHOW = 3
