import { expect, test } from '@playwright/test'

// Checks the production container, the way a browser meets it: the real headers, the real worker file and
// the real map tiles. The other tests use `vite preview`, which cannot see mistakes in the nginx
// configuration. These run in their own Playwright project, which exists only when CONTAINER_URL is set
// (see playwright.config.ts):
//
//   docker run -d -p 8080:8080 branch-locator
//   CONTAINER_URL=http://localhost:8080 npx playwright test --project=container

test.describe('the production container', () => {
  test.use({ geolocation: { latitude: -26.1076, longitude: 28.0567 }, permissions: ['geolocation'] })

  test('serves the app with no policy violations, a map worker that loads and vector tiles', async ({ page }) => {
    const violations: string[] = []
    const errors: string[] = []
    const tiles: string[] = []
    const workerTypes: string[] = []
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (event) => {
        ;(window as unknown as { __violations: string[] }).__violations ??= []
        ;(window as unknown as { __violations: string[] }).__violations.push(
          `${event.violatedDirective} blocked ${event.blockedURI}`,
        )
      })
    })
    page.on('console', (message) => {
      // The warnings about road shields come from OpenFreeMap's own style, not from this app.
      const upstream = /highway-shield|road_shield|boundary_3|GPU stall/.test(message.text())
      if (message.type() === 'error' && !upstream) errors.push(message.text())
    })
    page.on('response', (response) => {
      if (response.url().endsWith('.pbf') && response.ok()) tiles.push(response.url())
      if (response.url().endsWith('.mjs')) workerTypes.push(response.headers()['content-type'] ?? '')
    })

    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible()
    // Vector tiles are only requested once the map's worker has started.
    await expect.poll(() => tiles.length, { timeout: 20_000 }).toBeGreaterThan(0)

    // The parts of the page that draw or style things themselves: details, the Filters window.
    await page.getByRole('article').first().getByRole('button').first().click()
    await page.getByRole('button', { name: 'Back to results' }).click()
    await page.getByRole('button', { name: /^Filters/ }).click()
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()

    violations.push(
      ...(await page.evaluate(() => (window as unknown as { __violations?: string[] }).__violations ?? [])),
    )
    // A module worker is refused unless it is served as JavaScript, and nginx does not know .mjs by itself.
    expect(workerTypes.length).toBeGreaterThan(0)
    expect(workerTypes.every((type) => /javascript/.test(type))).toBe(true)
    expect(violations).toEqual([])
    expect(errors).toEqual([])
  })

  test('sends its security headers on the page and on the files', async ({ request }) => {
    for (const path of ['/', '/branches.json', '/favicon.svg']) {
      const headers = (await request.get(path)).headers()
      expect(headers['content-security-policy'], path).toContain("default-src 'self'")
      expect(headers['x-content-type-options'], path).toBe('nosniff')
      expect(headers['permissions-policy'], path).toContain('geolocation=(self)')
      expect(headers['referrer-policy'], path).toBeTruthy()
    }
  })

  test('caches the named files for good, and makes the page check every time', async ({ request }) => {
    const page = await (await request.get('/')).text()
    const asset = page.match(/\/assets\/[^"]+\.js/)![0]

    expect((await request.get(asset)).headers()['cache-control']).toBe('public, max-age=31536000, immutable')
    expect((await request.get('/')).headers()['cache-control']).toBe('no-cache')
    expect((await request.get('/branches.json')).headers()['cache-control']).toBe('no-cache')
  })

  test('compresses text files', async ({ request }) => {
    const page = await (await request.get('/')).text()
    const asset = page.match(/\/assets\/[^"]+\.js/)![0]

    const response = await request.get(asset, { headers: { 'Accept-Encoding': 'gzip' } })

    // Playwright decodes the body but keeps the header that says it was compressed.
    expect(response.headers()['content-encoding']).toBe('gzip')
  })

  test('answers the health check, and says 404 for what is not there', async ({ request }) => {
    expect((await request.get('/healthz')).ok()).toBe(true)
    expect((await request.get('/nothing-here')).status()).toBe(404)
  })

  test('does not say which nginx version it is', async ({ request }) => {
    expect((await request.get('/')).headers()['server']).toBe('nginx')
  })
})
