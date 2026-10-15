/** OpenFreeMap's quiet light style: no API key, and muted enough for our pins to stand out. */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron'

export const SOURCE_ID = 'branches'

export const LAYERS = {
  clusters: 'branch-clusters',
  clusterCount: 'branch-cluster-count',
  branches: 'branch-pins',
  atms: 'atm-pins',
  selected: 'branch-selected',
} as const

/** Pins merge into numbered clusters at or below this zoom, and split apart above it. */
export const CLUSTER_MAX_ZOOM = 13

/** Zoom used when a branch is chosen, which is close enough that it is never inside a cluster. */
export const SELECTED_ZOOM = 14
