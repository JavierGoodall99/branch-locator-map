import type { Branch, BranchWithDistance, Coordinates } from '../types'

const EARTH_RADIUS_KM = 6371.0088

const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance between two points, in kilometres (haversine formula). */
export function haversineKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Returns copies of `branches` with `distanceKm` from `origin`, nearest first. */
export function withDistanceFrom(branches: Branch[], origin: Coordinates): BranchWithDistance[] {
  return branches
    .map((branch) => ({ ...branch, distanceKm: haversineKm(origin, branch.location) }))
    .sort((a, b) => a.distanceKm - b.distanceKm || a.name.localeCompare(b.name))
}

const oneDecimal = new Intl.NumberFormat('en-ZA', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const wholeNumber = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 })

/**
 * A distance for people: metres to the nearest 10 under a kilometre, one decimal up to 10 km,
 * then whole kilometres. South African formatting, so the decimal separator is a comma.
 */
export function formatDistance(km: number): string {
  const metres = Math.round(km * 100) * 10
  if (metres < 1000) return `${metres} m`

  const rounded = Math.round(km * 10) / 10
  if (rounded < 10) return `${oneDecimal.format(rounded)} km`
  return `${wholeNumber.format(km)} km`
}
