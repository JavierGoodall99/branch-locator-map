import { expect, resultCount, test, openButton } from './fixtures'

/** Cape Town, so the nearest branches are in Cape Town and not the first ones by name. */
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
    await expect(nearest).toContainText('Cape Town')
    await expect(nearest.getByRole('heading')).not.toHaveText(nameBefore!)
    await expect(nearest).toContainText(/\d+ (m|km) away/)
    expect(await resultCount(page)).toBe(countBefore)
  })

  test('shows the distance on a branch when it is opened, and can be turned off again', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Near me' }).click()
    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')

    await openButton(page.getByRole('article').first()).click()
    await expect(page.locator('.branch-detail__distance')).toHaveText(/\d+ (m|km) away$/)
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
  test('does not ask for the location on load, and explains Near me on the button', async ({ page, context }) => {
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
    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('title', /stays on your device/)
    await expect(page.getByRole('article').first()).toBeVisible()

    asked = await page.evaluate(() => (window as unknown as { __geoAsked: boolean }).__geoAsked)
    expect(asked).toBe(false)
  })
})

test.describe('where Near me is', () => {
  test('is an icon button inside the search bar, with no extra text under it', async ({ page }) => {
    await page.goto('/')

    const bar = page.getByRole('search')
    await expect(bar.getByRole('button', { name: 'Near me' })).toBeVisible()
    await expect(page.getByText(/sorts by distance/)).toHaveCount(0)
    // The heading and count are kept for screen readers but not shown.
    await expect(page.getByRole('heading', { level: 1, name: 'Branches and ATMs' })).toHaveCount(1)
    await expect(page.getByText('Branches and ATMs', { exact: true })).not.toBeInViewport()
    // The Open now and province filters are gone.
    await expect(page.getByRole('button', { name: 'Open now' })).toHaveCount(0)
    await expect(page.getByRole('combobox', { name: 'Province' })).toHaveCount(0)
  })
})
