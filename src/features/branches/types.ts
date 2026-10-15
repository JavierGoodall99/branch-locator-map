export type BranchType = 'branch' | 'atm' | 'business-centre'

export type TradingStatus = 'open' | 'temporarily-closed' | 'permanently-closed'

export const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
] as const

export type Province = (typeof PROVINCES)[number]

export interface Coordinates {
  lat: number
  lng: number
}

/**
 * Daily opening times in 24-hour "HH:mm" format. Sites open around the clock use
 * open "00:00" and close "24:00".
 */
export interface OpeningHours {
  open: string
  close: string
}

export interface Branch {
  id: string
  name: string
  type: BranchType
  /** Services offered, for example "SmartID Services" or "Cash Accepting ATM". */
  services: string[]
  address: string
  province: Province
  postalCode: string
  phone: string | null
  location: Coordinates
  status: TradingStatus
  /** Null when the site has no published opening hours. */
  hours: OpeningHours | null
}

/** A branch with its distance from a reference point, in kilometres. */
export interface BranchWithDistance extends Branch {
  distanceKm: number
}
