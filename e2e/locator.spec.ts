import { expect, resultCount, test } from './fixtures'

test.describe('finding a branch', () => {
  test('lists the branches with a count', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: 'Branches and ATMs' })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'sorted by name' })).toBeVisible()
    await expect(page.getByRole('article').first()).toBeVisible()
    expect(await resultCount(page)).toBeGreaterThan(50)
  })

  test('searching narrows the list and clearing brings it back', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    const all = await resultCount(page)

    await page.getByRole('searchbox').fill('sandton')
    await expect.poll(() => resultCount(page)).toBeLessThan(all)
    expect(await resultCount(page)).toBeGreaterThan(0)
    await expect(page.getByRole('article').first()).toContainText('Sandton')

    await page.getByRole('button', { name: 'Clear search' }).first().click()
    await expect(page.getByRole('searchbox')).toHaveValue('')
    await expect.poll(() => resultCount(page)).toBe(all)
  })

  test('tells the user when nothing matches, and how to recover', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('searchbox').fill('zzzz nowhere')

    await expect(page.getByRole('heading', { name: 'No matches found' })).toBeVisible()
    await page.getByRole('button', { name: 'Clear search' }).first().click()
    await expect(page.getByRole('article').first()).toBeVisible()
  })

  test('switches between branches, ATMs and both', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    const branches = await resultCount(page)

    await page.getByRole('button', { name: 'Both' }).click()
    await expect.poll(() => resultCount(page)).toBeGreaterThan(branches)
    const both = await resultCount(page)

    await page.getByRole('button', { name: 'ATMs' }).click()
    await expect.poll(() => resultCount(page)).toBeLessThan(both)
    await expect(page.getByRole('button', { name: 'ATMs' })).toHaveAttribute('aria-pressed', 'true')
  })

})

test.describe('branch details', () => {
  test('opens a branch, steps through the list and goes back to where the user was', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.getByRole('article').first()
    await expect(firstCard).toBeVisible()
    const name = await firstCard.getByRole('heading').textContent()

    await firstCard.getByRole('button', { name: /^Details/ }).click()

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toHaveText(name!)
    await expect(heading).toBeFocused()
    await expect(page.getByRole('heading', { level: 2, name: 'Opening hours' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Directions/ })).toHaveAttribute('href', /google\.com\/maps\/dir/)

    await page.getByRole('button', { name: 'Next branch' }).click()
    await expect(heading).not.toHaveText(name!)
    await page.getByRole('button', { name: 'Previous branch' }).click()
    await expect(heading).toHaveText(name!)

    await page.getByRole('button', { name: 'Back to results' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Branches and ATMs' })).toBeVisible()
    await expect(firstCard.getByRole('button', { name: /^Details/ })).toBeFocused()
  })

  test('returns to the list when the search changes', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('article').first().getByRole('button', { name: /^Details/ }).click()
    await expect(page.getByRole('button', { name: 'Back to results' })).toBeVisible()

    await page.getByRole('searchbox').fill('paarl')

    await expect(page.getByRole('heading', { level: 1, name: 'Branches and ATMs' })).toBeVisible()
  })
})

test.describe('keyboard', () => {
  test('the skip link moves focus to the results', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Skip to results' })
    await expect(skip).toBeFocused()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('main')).toBeFocused()
  })
})
