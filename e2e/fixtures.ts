import { test as base, expect, type Locator, type Page, type Route } from '@playwright/test'

/**
 * A map style with nothing in it but a background. The real tiles come from a third party, so
 * tests must not depend on the network or on someone else's server being up. The map still loads,
 * draws our branch layers and fires the same events, which is what the app code cares about.
 */
const STUB_STYLE = {
  version: 8,
  name: 'test',
  // One empty source with a credit, so the map has an attribution to show, as the real style has.
  sources: {
    credit: { type: 'geojson', data: { type: 'FeatureCollection', features: [] }, attribution: 'Test map data' },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#e8ecef' } },
    { id: 'credit-layer', type: 'circle', source: 'credit' },
  ],
}

const MAP_HOST = '**/tiles.openfreemap.org/**'

/** Serves the stub style, and empty font files so the cluster counts do not wait on the network. */
export async function stubMap(page: Page) {
  await page.route(MAP_HOST, (route) => {
    const url = route.request().url()
    if (url.includes('/styles/')) return route.fulfill({ json: STUB_STYLE })
    if (url.includes('/fonts/')) return route.fulfill({ body: '', contentType: 'application/x-protobuf' })
    return route.fulfill({ status: 404 })
  })
}

/**
 * Makes the map's style request fail, as if the tile server were down or the user were offline.
 * Returns a function that lets requests through again, so a test can retry.
 */
export async function breakMap(page: Page): Promise<() => Promise<void>> {
  const pattern = '**/tiles.openfreemap.org/styles/**'
  const handler = (route: Route) => route.abort('connectionrefused')
  await page.route(pattern, handler)
  return () => page.unroute(pattern, handler)
}

export const test = base.extend({
  // Every test gets the stubbed map, so none of them touches the real tile server.
  page: async ({ page }, run) => {
    await stubMap(page)
    await run(page)
  },
})

export { expect }

/** The search field. It is a combobox, because it offers suggestions as the user types. */
export const searchField = (page: Page) => page.getByRole('combobox', { name: 'Search by name, suburb, town or postcode' })

/** The button on a card that opens its details: the name, which is stretched over the whole card. */
export const openButton = (card: Locator) => card.getByRole('heading').getByRole('button')

/** The number in the results count, for example 128 from "128 locations, sorted by name". */
export async function resultCount(page: Page): Promise<number> {
  const text = await page.getByRole('status').filter({ hasText: /^\d+ locations?/ }).first().textContent()
  const match = text?.match(/^(\d+)/)
  if (!match) throw new Error(`No result count found in: ${text}`)
  return Number(match[1])
}
