import type { Branch, BranchType, Province, TradingStatus } from '../types'

const BRANCH_TYPES: readonly BranchType[] = ['branch', 'atm', 'business-centre']
const STATUSES: readonly TradingStatus[] = ['open', 'temporarily-closed', 'permanently-closed']
const PROVINCES: readonly Province[] = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
]
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$|^24:00$/

export class BranchesApiError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'BranchesApiError'
  }
}

type Json = Record<string, unknown>

const isObject = (value: unknown): value is Json => typeof value === 'object' && value !== null
const isString = (value: unknown): value is string => typeof value === 'string' && value.length > 0
const isOneOf = <T extends string>(options: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (options as readonly string[]).includes(value)

function isCoordinates(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.lat === 'number' &&
    typeof value.lng === 'number' &&
    value.lat >= -90 &&
    value.lat <= 90 &&
    value.lng >= -180 &&
    value.lng <= 180
  )
}

function isHours(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.open === 'string' &&
    typeof value.close === 'string' &&
    TIME_PATTERN.test(value.open) &&
    TIME_PATTERN.test(value.close)
  )
}

function isBranch(value: unknown): value is Branch {
  return (
    isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isOneOf(BRANCH_TYPES, value.type) &&
    Array.isArray(value.services) &&
    value.services.every((service) => typeof service === 'string') &&
    isString(value.address) &&
    isOneOf(PROVINCES, value.province) &&
    typeof value.postalCode === 'string' &&
    (value.phone === null || typeof value.phone === 'string') &&
    isCoordinates(value.location) &&
    isOneOf(STATUSES, value.status) &&
    (value.hours === null || isHours(value.hours))
  )
}

/** Checks untrusted JSON against the Branch shape, failing loudly on the first bad record. */
export function parseBranches(data: unknown): Branch[] {
  if (!Array.isArray(data)) {
    throw new BranchesApiError('Branch data must be an array.')
  }
  data.forEach((record, index) => {
    if (!isBranch(record)) {
      throw new BranchesApiError(`Invalid branch record at index ${index}.`)
    }
  })
  return data as Branch[]
}

const BRANCHES_URL = `${import.meta.env.BASE_URL}branches.json`

/** Loads branches from the mock API (a static JSON file served with the app). */
export async function fetchBranches(signal?: AbortSignal): Promise<Branch[]> {
  let response: Response
  try {
    response = await fetch(BRANCHES_URL, { signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new BranchesApiError('Could not reach the branch service.', { cause: error })
  }

  if (!response.ok) {
    throw new BranchesApiError(`Branch service responded with status ${response.status}.`)
  }

  let body: unknown
  try {
    body = await response.json()
  } catch (error) {
    throw new BranchesApiError('Branch service returned invalid JSON.', { cause: error })
  }
  return parseBranches(body)
}
