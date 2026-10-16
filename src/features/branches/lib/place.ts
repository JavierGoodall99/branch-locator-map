import type { Branch } from '../types'

// Addresses mix streets and shopping centres in with the suburb and town. This keeps the places
// people would actually search for: nothing with a number in it, and nothing that names a road or
// a centre.
const NOT_A_PLACE =
  /\b(street|road|avenue|drive|centre|center|mall|plaza|square|crossing|shop|lane|boulevard|building|station|walk|junction|market|cnr|corner)\b/i

export function isPlaceName(text: string | undefined): text is string {
  return Boolean(text) && !/\d/.test(text!) && !NOT_A_PLACE.test(text!)
}

/** The comma-separated parts of an address, and where the province is among them. */
function split(branch: Branch): { parts: string[]; provinceAt: number } {
  const parts = branch.address.split(',').map((part) => part.trim())
  return { parts, provinceAt: parts.lastIndexOf(branch.province) }
}

/**
 * The town or city. Addresses end "..., <suburb>, <town>, <province>, <postcode>", so it is the part
 * just before the province.
 */
export function townOf(branch: Branch): string {
  const { parts, provinceAt } = split(branch)
  return (provinceAt > 0 ? parts[provinceAt - 1] : undefined) ?? branch.province
}

/** The most local place in the address: the suburb if there is one, otherwise the town. */
export function localityOf(branch: Branch): string {
  const { parts, provinceAt } = split(branch)
  const suburb = provinceAt > 1 ? parts[provinceAt - 2] : undefined
  return isPlaceName(suburb) ? suburb : townOf(branch)
}

/** Every place-like part of an address that sits before the province: the suburb and the town. */
export function placeNamesOf(branch: Branch): string[] {
  const { parts, provinceAt } = split(branch)
  if (provinceAt <= 0) return []
  return [provinceAt - 1, provinceAt - 2].filter((at) => at >= 0).map((at) => parts[at]).filter(isPlaceName)
}
