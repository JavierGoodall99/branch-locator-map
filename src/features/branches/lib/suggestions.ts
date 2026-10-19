import type { Branch, BranchType } from '@/features/branches/types'
import { normalise } from './filter'
import { placeNamesOf, townOf } from './place'

/** Suggestions start once the user has typed this much. One letter would match nearly everything. */
export const MIN_QUERY_LENGTH = 2

export type PlaceKind = 'place' | 'province' | 'postcode'

export interface PlaceEntry {
  kind: PlaceKind
  /** How it is shown, and what it puts into the search box. */
  label: string
  /** The label, lower-cased and without accents, for matching. */
  key: string
  /** How many open or temporarily closed sites are there. */
  count: number
}

export interface BranchSuggestion {
  id: string
  name: string
  type: BranchType
  /** The town the site is in, shown under its name. */
  place: string
}

export interface Suggestions {
  places: PlaceEntry[]
  branches: BranchSuggestion[]
}

export interface SuggestionLimits {
  places: number
  branches: number
}

const DEFAULT_LIMITS: SuggestionLimits = { places: 3, branches: 5 }

const POSTCODE = /^\d{4}$/

/**
 * The towns, suburbs, provinces and postcodes found in the branches' addresses, each with how many
 * sites are there. Addresses end "..., <suburb>, <town>, <province>, <postcode>", so the two
 * segments before the province are the candidates. Build it once and reuse it for every keystroke.
 */
export function buildPlaceIndex(branches: Branch[]): PlaceEntry[] {
  const entries = new Map<string, PlaceEntry>()

  const add = (kind: PlaceKind, label: string) => {
    const key = normalise(label)
    const id = `${kind}:${key}`
    const existing = entries.get(id)
    if (existing) existing.count += 1
    else entries.set(id, { kind, label, key, count: 1 })
  }

  for (const branch of branches) {
    if (branch.status === 'permanently-closed') continue

    for (const place of placeNamesOf(branch)) add('place', place)

    add('province', branch.province)
    if (POSTCODE.test(branch.postalCode)) add('postcode', branch.postalCode)
  }

  return [...entries.values()]
}

/** 0 = starts with the text, 1 = a word in it does, 2 = it appears somewhere inside; null = no match. */
function placeRank(key: string, query: string): number | null {
  if (key.startsWith(query)) return 0
  if (` ${key}`.includes(` ${query}`)) return 1
  if (key.includes(query)) return 2
  return null
}

/** 1 = every typed word starts a word in the name, 2 = every typed word appears in it; null = no match. */
function nameRank(name: string, words: string[]): number | null {
  if (!words.every((word) => name.includes(word))) return null
  const nameWords = name.split(' ')
  return words.every((word) => nameWords.some((nameWord) => nameWord.startsWith(word))) ? 1 : 2
}

/** Places and branches that match what the user has typed, best first. */
export function suggest(
  query: string,
  places: PlaceEntry[],
  branches: Branch[],
  limits: Partial<SuggestionLimits> = {},
): Suggestions {
  const { places: placeLimit, branches: branchLimit } = { ...DEFAULT_LIMITS, ...limits }
  const text = normalise(query).replace(/\s+/g, ' ')
  if (text.length < MIN_QUERY_LENGTH) return { places: [], branches: [] }

  const matchedPlaces = places
    .map((place) => ({ place, rank: placeRank(place.key, text) }))
    .filter((item): item is { place: PlaceEntry; rank: number } => item.rank !== null)
    .sort((a, b) => a.rank - b.rank || b.place.count - a.place.count || a.place.label.localeCompare(b.place.label))
    .slice(0, placeLimit)
    .map((item) => item.place)

  const words = text.split(' ')
  const matchedBranches = branches
    .filter((branch) => branch.status !== 'permanently-closed')
    .map((branch) => ({ branch, rank: nameRank(normalise(branch.name), words) }))
    .filter((item): item is { branch: Branch; rank: number } => item.rank !== null)
    // Among equally good matches the shorter name is the closer one.
    .sort(
      (a, b) =>
        a.rank - b.rank || a.branch.name.length - b.branch.name.length || a.branch.name.localeCompare(b.branch.name),
    )
    .slice(0, branchLimit)
    .map(({ branch }) => ({ id: branch.id, name: branch.name, type: branch.type, place: townOf(branch) }))

  return { places: matchedPlaces, branches: matchedBranches }
}
