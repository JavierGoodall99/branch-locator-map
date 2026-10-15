import type { Branch, BranchType } from '../types'

/** [[west, south], [east, north]] in degrees, the order MapLibre expects. */
export type Bounds = [[number, number], [number, number]]

/** A view of all of South Africa, used before the user has narrowed anything. */
export const SOUTH_AFRICA_BOUNDS: Bounds = [
  [16.3, -34.9],
  [32.9, -22.1],
]

export interface BranchFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: { id: string; name: string; type: BranchType }
}

export interface BranchFeatureCollection {
  type: 'FeatureCollection'
  features: BranchFeature[]
}

/** Branches as GeoJSON points, the format the map draws. GeoJSON puts longitude first. */
export function toFeatureCollection(branches: Branch[]): BranchFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: branches.map((branch) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [branch.location.lng, branch.location.lat] },
      properties: { id: branch.id, name: branch.name, type: branch.type },
    })),
  }
}

/** The smallest box around the branches, or null if there are none. */
export function boundsFor(branches: Branch[]): Bounds | null {
  if (branches.length === 0) return null

  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const { location } of branches) {
    west = Math.min(west, location.lng)
    east = Math.max(east, location.lng)
    south = Math.min(south, location.lat)
    north = Math.max(north, location.lat)
  }
  return [
    [west, south],
    [east, north],
  ]
}

/**
 * A stable identity for a set of branches. The list is rebuilt every minute as the clock
 * ticks, and the map must only move when the branches themselves change, not on every tick.
 */
export function idsKey(branches: Branch[]): string {
  return branches.map((branch) => branch.id).join('|')
}
