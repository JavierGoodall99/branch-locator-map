import type { Coordinates } from '@/features/branches/types'

/** Opens turn-by-turn directions to a point in the user's maps app. */
export function directionsUrl({ lat, lng }: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/** A tel: link, keeping only digits and the leading plus. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}
