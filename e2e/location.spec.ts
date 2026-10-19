import { expect, resultCount, test, openButton, searchField } from './fixtures'

/** Cape Town, so the nearest branches are in Cape Town and not the first ones by name. */
const CAPE_TOWN = { latitude: -33.9249, longitude: 18.4241 }

test.describe('near me when the browser allows it', () => {
  test.use({ geolocation: CAPE_TOWN, permissions: ['geolocation'] })

  test('finds the location by itself on arrival, and lists the nearest first within 25 km', async ({ page }) => {
    await page.goto('/')

    // Nobody presses Near me: the page asked as it opened.
    await expect(page.getByRole('status').filter({ hasText: 'within 25 km, nearest first' }).first()).toBeAttached()
    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
    const nearest = page.getByRole('article').first()
    await expect(nearest).toContainText('Cape Town')
    await expect(nearest).toContainText(/\d+ (m|km) away/)
  })

  test('starts on Both, with Both first in the switch', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    const options = page.getByRole('group', { name: 'Show' }).getByRole('button')
    await expect(options).toHaveText(['Both', 'Branches', 'ATMs'])
    await expect(page.getByRole('button', { name: 'Both' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('changes the distance, and any distance comes back when the chosen one is pressed again', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
    const within25 = await resultCount(page)

    await page.getByRole('button', { name: '10 km' }).click()
    await expect.poll(() => resultCount(page)).toBeLessThan(within25)
    expect(await resultCount(page)).toBeGreaterThan(0)
    await expect(page.getByRole('status').filter({ hasText: 'within 10 km' }).first()).toBeAttached()

    await page.getByRole('button', { name: '10 km' }).click()
    await expect.poll(() => resultCount(page)).toBeGreaterThan(within25)
  })

  test('searching for a place elsewhere sets the distance aside, so it is found', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')

    await searchField(page).fill('sandton')
    await page.keyboard.press('Enter')

    // Sandton is nowhere near Cape Town, so it only shows up once the distance steps aside.
    await expect(page.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'false')
    await expect.poll(() => resultCount(page)).toBeGreaterThan(0)
  })

  test('shows the distance on a branch when it is opened, and can be turned off again', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')

    await openButton(page.getByRole('article').first()).click()
    await expect(page.locator('.branch-detail__distance')).toHaveText(/\d+ (m|km) away$/)
    await page.getByRole('button', { name: 'Back to results' }).click()

    await page.getByRole('button', { name: 'Near me' }).click()
    await expect(page.getByRole('status').filter({ hasText: 'sorted by name' }).first()).toBeVisible()
    await expect(page.getByText(/\d+ (m|km) away/)).toHaveCount(0)
    await expect(page.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('a distance pill finds the location again after Near me was turned off', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Near me' }).click()
    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'false')

    await page.getByRole('button', { name: '10 km' }).click()

    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: '10 km' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status').filter({ hasText: 'within 10 km' }).first()).toBeAttached()
  })
})

test.describe('near me when the browser blocks it', () => {
  test.use({ permissions: [] })

  test('keeps the whole list by name, and explains how to carry on', async ({ page }) => {
    await page.goto('/')

    // The browser has said no for good, so it would not show its prompt again: the message says what helps.
    await expect(page.getByText('Location is blocked. Allow it in your browser.')).toBeVisible()
    // What to do next is always on the page for a screen reader, and shown beside the map; a phone keeps it short.
    await expect(page.getByText(/lock icon beside the web address/)).toBeAttached()
    await expect(page.getByText(/search by name, suburb or postcode/)).toBeAttached()
    await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
    await expect(page.getByRole('article').first()).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'sorted by name' }).first()).toBeAttached()
    await expect(page.getByText(/\d+ (m|km) away/)).toHaveCount(0)
    // The distances stay on: choosing one asks again, which is the way back after a refusal.
    await expect(page.getByRole('button', { name: '25 km' })).toBeEnabled()
    await expect(page.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'false')
  })
})

test.describe('allowing location after it was blocked', () => {
  test.use({ permissions: [], geolocation: CAPE_TOWN })

  test('finds the location by itself when the browser setting is changed, with no button pressed', async ({
    page,
    context,
  }) => {
    await page.goto('/')
    await expect(page.getByText('Location is blocked. Allow it in your browser.')).toBeVisible()

    // The user opens the site settings (the lock icon) and allows location.
    await context.grantPermissions(['geolocation'], { origin: new URL(page.url()).origin })

    await expect(page.getByRole('button', { name: 'Near me' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status').filter({ hasText: 'nearest first' }).first()).toBeAttached()
    await expect(page.getByText('Location is blocked. Allow it in your browser.')).toHaveCount(0)
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
    // Open now and the province are in the Filters window, not on the page.
    await expect(page.getByRole('button', { name: 'Open now' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Gauteng' })).toHaveCount(0)
  })
})
