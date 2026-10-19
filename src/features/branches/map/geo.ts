import type { Branch, BranchType, Coordinates } from '@/features/branches/types'

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

/** The smallest box around the points, or null if there are none. */
export function boundsOfPoints(points: Coordinates[]): Bounds | null {
  if (points.length === 0) return null

  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const { lat, lng } of points) {
    west = Math.min(west, lng)
    east = Math.max(east, lng)
    south = Math.min(south, lat)
    north = Math.max(north, lat)
  }
  return [
    [west, south],
    [east, north],
  ]
}

/** The smallest box around the branches, or null if there are none. */
export function boundsFor(branches: Branch[]): Bounds | null {
  return boundsOfPoints(branches.map((branch) => branch.location))
}

/** The user's position as GeoJSON: one point, or none, which removes their dot from the map. */
export function userLocationCollection(location: Coordinates | null) {
  return {
    type: 'FeatureCollection' as const,
    features: location
      ? [
          {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [location.lng, location.lat] as [number, number] },
            properties: {},
          },
        ]
      : [],
  }
}

/**
 * A stable identity for a set of branches. The list is rebuilt every minute as the clock
 * ticks, and the map must only move when the branches themselves change, not on every tick.
 */
export function idsKey(branches: Branch[]): string {
  return branches.map((branch) => branch.id).join('|')
}
