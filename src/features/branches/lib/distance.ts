import type { Branch, BranchWithDistance, Coordinates } from '../types'

const EARTH_RADIUS_KM = 6371.0088

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance between two points, in kilometres (haversine formula). */
export function haversineKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Returns copies of `branches` with `distanceKm` from `origin`, nearest first. */
export function withDistanceFrom(branches: Branch[], origin: Coordinates): BranchWithDistance[] {
  return branches
    .map((branch) => ({ ...branch, distanceKm: haversineKm(origin, branch.location) }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name))
}
