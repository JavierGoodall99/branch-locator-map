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
