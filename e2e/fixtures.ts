import { test as base, expect, type Page } from '@playwright/test'

/**
 * A map style with nothing in it but a background. The real tiles come from a third party, so
 * tests must not depend on the network or on someone else's server being up. The map still loads,
 * draws our branch layers and fires the same events, which is what the app code cares about.
 */
const STUB_STYLE = {
  version: 8,
  name: 'test',
  sources: {},
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#e8ecef' } }],
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

/** Makes the map's style request fail, as if the tile server were down or the user were offline. */
export async function breakMap(page: Page) {
  await page.route(`${MAP_HOST.replace('/**', '')}/styles/**`, (route) => route.abort('connectionrefused'))
}

export const test = base.extend({
  // Every test gets the stubbed map, so none of them touches the real tile server.
  page: async ({ page }, run) => {
    await stubMap(page)
    await run(page)
  },
})

export { expect }

/** The number in the results count, for example 128 from "128 locations, sorted by name". */
export async function resultCount(page: Page): Promise<number> {
  const text = await page.getByRole('status').filter({ hasText: /locations?,/ }).first().textContent()
  const match = text?.match(/^(\d+)/)
  if (!match) throw new Error(`No result count found in: ${text}`)
  return Number(match[1])
}
