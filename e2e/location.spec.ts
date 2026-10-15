import { expect, resultCount, test } from './fixtures'

/** Cape Town, so the nearest branches are in the Western Cape and not the first ones by name. */
const CAPE_TOWN = { latitude: -33.9249, longitude: 18.4241 }

test.describe('near me when the browser allows it', () => {
  test.use({ geolocation: CAPE_TOWN, permissions: ['geolocation'] })

  test('sorts the nearest first and shows how far away each is', async ({ page }) => {
    await page.goto('/')
    const firstByName = page.getByRole('article').first()
    await expect(firstByName).toBeVisible()
    const nameBefore = await firstByName.getByRole('heading').textContent()
    const countBefore = await resultCount(page)

    await page.getByRole('button', { name: 'Near me' }).click()

    await expect(page.getByRole('status').filter({ hasText: 'nearest first' }).first()).toBeVisible()
    const nearest = page.getByRole('article').first()
    await expect(nearest).toContainText('Western Cape')
    await expect(nearest.getByRole('heading')).not.toHaveText(nameBefore!)
    await expect(nearest).toContainText(/\d+ (m|km) away/)
    expect(await resultCount(page)).toBe(countBefore)
  })

  test('shows the distance on a branch when it is opened, and can be turned off again', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Near me' }).click()
    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('article').first().getByRole('button', { name: /^Details/ }).click()
    await expect(page.getByText(/\d+ (m|km) away$/)).toBeVisible()
    await page.getByRole('button', { name: 'Back to results' }).click()

    await page.getByRole('button', { name: 'Near me' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'sorted by name' }).first()).toBeVisible()
    await expect(page.getByText(/\d+ (m|km) away/)).toHaveCount(0)
  })
})

test.describe('near me when the browser blocks it', () => {
  test.use({ permissions: [] })

  test('keeps the list and explains how to carry on', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    const before = await resultCount(page)

    await page.getByRole('button', { name: 'Near me' }).click()

    await expect(page.getByText(/turned off for this site/)).toBeVisible()
    await expect(page.getByText(/search by name, suburb or postcode/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible()
    expect(await resultCount(page)).toBe(before)
    await expect(page.getByText(/\d+ (m|km) away/)).toHaveCount(0)
  })
})

test.describe('before anything is asked', () => {
  test('explains Near me up front and does not ask for the location on load', async ({ page, context }) => {
    let asked = false
    await context.addInitScript(() => {
      const original = navigator.geolocation?.getCurrentPosition?.bind(navigator.geolocation)
      Object.defineProperty(window, '__geoAsked', { value: false, writable: true })
      if (navigator.geolocation && original) {
        navigator.geolocation.getCurrentPosition = (...args) => {
          ;(window as unknown as { __geoAsked: boolean }).__geoAsked = true
          return original(...args)
        }
      }
    })

    await page.goto('/')
    await expect(page.getByText(/sorts by distance. Your location stays on your device/)).toBeVisible()
    await expect(page.getByRole('article').first()).toBeVisible()

    asked = await page.evaluate(() => (window as unknown as { __geoAsked: boolean }).__geoAsked)
    expect(asked).toBe(false)
  })
})
