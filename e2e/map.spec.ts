import { breakMap, expect, resultCount, searchField, test } from './fixtures'

test.describe('the map', () => {
  test('loads with zoom controls, and the list does not wait for it', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('article').first()).toBeVisible()
    await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible()
    await expect(page.getByText('Loading map…')).toHaveCount(0)
    await expect(page.getByRole('alert')).toHaveCount(0)
  })

  test('is a labelled region that comes after the list', async ({ page }) => {
    await page.goto('/')

    const map = page.getByRole('region', { name: 'Map of branches and ATMs' })
    await expect(map).toBeVisible()
    const order = await page.evaluate(() => {
      const main = document.querySelector('main')!
      const region = document.querySelector('[aria-label="Map of branches and ATMs"]')!
      return Boolean(main.compareDocumentPosition(region) & Node.DOCUMENT_POSITION_FOLLOWING)
    })
    expect(order).toBe(true)
  })

  test('leaves a usable strip of map on a phone, between the controls and the results', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This is about the phone layout')
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    const strip = await page.evaluate(() => {
      const controls = document.querySelector('.locator__controls')!.getBoundingClientRect()
      const sheet = document.querySelector('.locator__results')!.getBoundingClientRect()
      return sheet.top - controls.bottom
    })

    expect(strip).toBeGreaterThanOrEqual(120)
  })

  test('the handle lowers the results sheet to a strip, and raises it again, on a phone', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The handle is only on the phone layout')
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    const sheetTop = () => page.evaluate(() => document.querySelector('.locator__results')!.getBoundingClientRect().top)
    const half = await sheetTop()

    await page.getByRole('button', { name: 'Hide results' }).click()

    await expect(page.getByRole('article')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Show results' })).toBeVisible()
    const viewport = page.viewportSize()!
    expect(await sheetTop()).toBeGreaterThan(viewport.height * 0.85)
    expect(half).toBeLessThan(viewport.height * 0.6)
    // The zoom buttons and the attribution drop with it, so they stay visible.
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeInViewport()

    await page.getByRole('button', { name: 'Show results' }).click()

    await expect(page.getByRole('article').first()).toBeVisible()
    expect(await sheetTop()).toBeCloseTo(half, 0)
  })

  test('has no handle beside the map on a wide screen', async ({ page, isMobile }) => {
    test.skip(isMobile, 'This is about the wide layout')
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    await expect(page.getByRole('button', { name: 'Hide results' })).toBeHidden()
  })

  test('the details take a taller sheet on a phone, with Get directions in view', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This is about the phone layout')
    await page.goto('/')
    await page.getByRole('article').first().getByRole('button').first().click()

    const directions = page.getByRole('link', { name: /Get directions/ })
    await expect(directions).toBeInViewport({ ratio: 1 })
    const sheetTop = await page.evaluate(() => document.querySelector('.locator__results')!.getBoundingClientRect().top)
    expect(sheetTop).toBeLessThanOrEqual(page.viewportSize()!.height * 0.45)
  })

  test('the details have no photo on a phone, and do not download one', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This is about the phone layout')
    const images: string[] = []
    page.on('request', (request) => {
      if (/capitec-atm/.test(request.url())) images.push(request.url())
    })
    await page.goto('/')
    await page.getByRole('article').first().getByRole('button').first().click()

    await expect(page.getByRole('button', { name: 'Back to results' })).toBeVisible()
    await expect(page.locator('.branch-detail img')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Get directions/ })).toBeInViewport({ ratio: 1 })
    expect(images).toEqual([])
  })

  test('the details have the photo beside the map on a wide screen', async ({ page, isMobile }) => {
    test.skip(isMobile, 'This is about the wide layout')
    await page.goto('/')
    await page.getByRole('article').first().getByRole('button').first().click()

    await expect(page.locator('.branch-detail .detail-hero img')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to results' })).toBeVisible()
  })

  test('the way back is in the top left corner of the screen on a phone', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This is about the phone layout')
    await page.goto('/')
    await page.getByRole('article').first().getByRole('button').first().click()

    const back = page.getByRole('button', { name: 'Back to results' })
    await expect(back).toBeVisible()
    const box = (await back.boundingBox())!
    expect(box.x).toBeLessThanOrEqual(16)
    expect(box.y).toBeLessThanOrEqual(16)
    // It stays put while the details scroll.
    await page.locator('.locator__results').evaluate((sheet) => sheet.scrollBy(0, 200))
    expect((await back.boundingBox())!.y).toBeCloseTo(box.y, 0)
  })

  test('the map credit starts closed on a phone, behind its info button, and can be opened', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'This is about the phone layout')
    await page.goto('/')
    await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible()
    const credit = page.locator('.maplibregl-ctrl-attrib')
    // MapLibre shows the credit's text while the control has this class.
    await expect(credit).toHaveClass(/maplibregl-compact(?!-show)/)
    await expect(credit).not.toHaveClass(/maplibregl-compact-show/)
    await expect(credit.locator('.maplibregl-ctrl-attrib-inner')).toBeHidden()
    await expect(page.locator('.maplibregl-ctrl-attrib-button')).toBeVisible()

    await page.locator('.maplibregl-ctrl-attrib-button').click()
    await expect(credit).toHaveClass(/maplibregl-compact-show/)
    await expect(credit.locator('.maplibregl-ctrl-attrib-inner')).toBeVisible()
  })

  test('says so when it cannot load, keeps the list usable, and recovers on retry', async ({ page }) => {
    const restore = await breakMap(page)

    await page.goto('/')

    await expect(page.getByRole('alert')).toContainText('The map couldn’t load')
    await expect(page.getByRole('article').first()).toBeVisible()
    const before = await resultCount(page)
    await searchField(page).fill('sandton')
    await page.keyboard.press('Enter')
    await expect.poll(() => resultCount(page)).toBeLessThan(before)

    await restore()
    await page.getByRole('region', { name: 'Map of branches and ATMs' }).getByRole('button', { name: 'Try again' }).click()

    await expect(page.getByRole('alert')).toHaveCount(0)
    await expect(page.locator('canvas.maplibregl-canvas')).toBeVisible()
  })
})
