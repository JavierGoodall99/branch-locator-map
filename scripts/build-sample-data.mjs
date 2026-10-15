// Builds the curated sample dataset (public/branches.json) from a raw export of
// a public branch-locator feed. The raw file is large and is not committed.
//
// Usage: node scripts/build-sample-data.mjs [input.json] [output.json]
// Defaults: data/raw/capitec-locator.json -> public/branches.json
//
// Selection is deterministic (hash-ordered, no randomness), so rerunning the
// script on the same input produces identical output.

import { readFileSync, writeFileSync } from 'node:fs'

const input = process.argv[2] ?? 'data/raw/capitec-locator.json'
const output = process.argv[3] ?? 'public/branches.json'

const PROVINCES = [
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

const QUOTA = {
  branch: 120,
  atm: 55,
  'business-centre': 8,
  temporarilyClosed: 4,
  permanentlyClosed: 3,
  noHours: 5,
}
const MIN_BRANCHES_PER_PROVINCE = 4

const STATUS = {
  Open: 'open',
  'Temporarily Closed': 'temporarily-closed',
  'Permanently Closed': 'permanently-closed',
}

/** Small stable string hash (FNV-1a) used to order records without randomness. */
function hash(text) {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** "8:00 AM" -> "08:00", "5:30 PM" -> "17:30". Returns null if unparseable. */
function to24Hour(value) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(value ?? '').trim())
  if (!match) return null
  let hours = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') hours += 12
  return `${String(hours).padStart(2, '0')}:${match[2]}`
}

function toType(services) {
  if (services.includes('Business Banking Centre')) return 'business-centre'
  if (services.includes('Branch')) return 'branch'
  return 'atm'
}

function toHours(operatingHours) {
  if (!operatingHours?.has_operating_hours) return null
  const open = to24Hour(operatingHours.operating_time_open)
  const close = to24Hour(operatingHours.operating_time_closed)
  if (!open || !close) return null
  // The source encodes "open 24 hours" as 00:00 to 00:00; make that explicit.
  if (open === '00:00' && close === '00:00') return { open, close: '24:00' }
  return { open, close }
}

/** Maps a raw record to our schema, or returns null if it is unusable. */
function normalise(raw) {
  const lat = Number(raw.latitude)
  const lng = Number(raw.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  // Addresses end in "..., <Province>, <postal code>, South Africa".
  const parts = String(raw.address ?? '')
    .split(',')
    .map((part) => part.trim())
  const province = parts.at(-3)
  const postalCode = parts.at(-2)
  if (!PROVINCES.includes(province) || !/^\d{4}$/.test(postalCode ?? '')) return null

  const status = STATUS[raw.trading_status]
  if (!status) return null

  const services = (raw.attributes ?? []).map((attribute) => attribute.value)

  return {
    id: raw.slug,
    name: raw.name,
    type: toType(services),
    services,
    address: parts.slice(0, -1).join(', '),
    province,
    postalCode,
    phone: raw.primaryNumber || null,
    location: { lat, lng },
    status,
    hours: toHours(raw.operating_hours),
  }
}

const byHash = (a, b) => hash(a.id) - hash(b.id) || a.id.localeCompare(b.id)

/** Splits `total` across groups by weight, with a minimum each (largest remainder). */
function allocate(weights, total, minimum) {
  const keys = Object.keys(weights)
  const spare = total - minimum * keys.length
  const weightSum = keys.reduce((sum, key) => sum + weights[key], 0)
  const exact = Object.fromEntries(keys.map((key) => [key, (spare * weights[key]) / weightSum]))
  const result = Object.fromEntries(keys.map((key) => [key, minimum + Math.floor(exact[key])]))
  let remaining = total - Object.values(result).reduce((sum, value) => sum + value, 0)
  const byRemainder = [...keys].sort((a, b) => exact[b] - Math.floor(exact[b]) - (exact[a] - Math.floor(exact[a])))
  for (const key of byRemainder) {
    if (remaining <= 0) break
    result[key] += 1
    remaining -= 1
  }
  return result
}

const raw = JSON.parse(readFileSync(input, 'utf8'))
const records = raw.stores.map(normalise).filter(Boolean)
const chosen = new Map()
const take = (candidates, count) => {
  for (const record of candidates.sort(byHash)) {
    if (count <= 0) break
    if (chosen.has(record.id)) continue
    chosen.set(record.id, record)
    count -= 1
  }
}

const open = records.filter((record) => record.status === 'open')
const hasHours = (record) => record.hours !== null

// Branches: spread across provinces in proportion to how many each has.
const branches = open.filter((record) => record.type === 'branch' && hasHours(record))
const branchCounts = Object.fromEntries(
  PROVINCES.map((province) => [province, branches.filter((record) => record.province === province).length]),
)
const branchQuota = allocate(branchCounts, QUOTA.branch, MIN_BRANCHES_PER_PROVINCE)
for (const province of PROVINCES) {
  take(branches.filter((record) => record.province === province), branchQuota[province])
}

take(open.filter((record) => record.type === 'atm' && hasHours(record)), QUOTA.atm)
take(open.filter((record) => record.type === 'business-centre' && hasHours(record)), QUOTA['business-centre'])

// Edge cases the UI and filters must handle.
take(records.filter((record) => record.status === 'temporarily-closed'), QUOTA.temporarilyClosed)
take(records.filter((record) => record.status === 'permanently-closed'), QUOTA.permanentlyClosed)
take(open.filter((record) => !hasHours(record)), QUOTA.noHours)

const sample = [...chosen.values()].sort(
  (a, b) => a.province.localeCompare(b.province) || a.name.localeCompare(b.name),
)

// One record per line keeps diffs readable.
writeFileSync(output, `[\n${sample.map((record) => `  ${JSON.stringify(record)}`).join(',\n')}\n]\n`)

const tally = (key) =>
  Object.entries(Object.groupBy(sample, (record) => record[key]))
    .map(([name, list]) => `${name}: ${list.length}`)
    .join(', ')
console.log(`Read ${raw.stores.length} records, ${records.length} usable. Wrote ${sample.length} to ${output}.`)
console.log(`By type: ${tally('type')}`)
console.log(`By status: ${tally('status')}`)
console.log(`By province: ${tally('province')}`)
console.log(`Without hours: ${sample.filter((record) => !record.hours).length}`)
