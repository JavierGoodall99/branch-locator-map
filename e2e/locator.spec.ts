import { expect, resultCount, test, searchField, openButton } from './fixtures'

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

    await searchField(page).fill('sandton')
    // Typing alone changes nothing: the list waits for Enter or a chosen suggestion.
    expect(await resultCount(page)).toBe(all)
    await page.keyboard.press('Enter')
    await expect.poll(() => resultCount(page)).toBeLessThan(all)
    expect(await resultCount(page)).toBeGreaterThan(0)

    await page.getByRole('button', { name: 'Clear search' }).first().click()
    await expect(searchField(page)).toHaveValue('')
    await expect.poll(() => resultCount(page)).toBe(all)
  })

  test('the Search button searches too, for people not using the keyboard', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    const all = await resultCount(page)

    await searchField(page).fill('paarl')
    expect(await resultCount(page)).toBe(all)
    await page.getByRole('button', { name: 'Search', exact: true }).click()

    await expect.poll(() => resultCount(page)).toBeLessThan(all)
    await expect(page.getByRole('article').first()).toContainText('Paarl')
  })

  test('tells the user when nothing matches, and how to recover', async ({ page }) => {
    await page.goto('/')

    await searchField(page).fill('zzzz nowhere')
    await page.keyboard.press('Enter')

    await expect(page.getByRole('heading', { name: 'No matches found' })).toBeVisible()
    await page.getByRole('button', { name: 'Clear search' }).first().click()
    await expect(page.getByRole('article').first()).toBeVisible()
  })

  test('switches between branches, ATMs and both', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    const branches = await resultCount(page)

    await page.getByRole('button', { name: 'Filters' }).click()
    await page.getByRole('button', { name: 'Both' }).click()
    await expect.poll(() => resultCount(page)).toBeGreaterThan(branches)
    const both = await resultCount(page)

    await page.getByRole('button', { name: 'ATMs' }).click()
    await expect.poll(() => resultCount(page)).toBeLessThan(both)
    await expect(page.getByRole('button', { name: 'ATMs' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: 'Filters, 1 in use' })).toBeVisible()
  })

})

test.describe('branch details', () => {
  test('opens a branch and goes back to where the user was', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.getByRole('article').first()
    await expect(firstCard).toBeVisible()
    const name = await firstCard.getByRole('heading').textContent()

    await openButton(firstCard).click()

    const heading = page.getByRole('heading', { level: 1 })
    await expect(heading).toHaveText(name!)
    await expect(heading).toBeFocused()
    await expect(page.getByRole('heading', { level: 2, name: 'Opening hours' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Get directions/ })).toHaveAttribute('href', /google\.com\/maps\/dir/)

    await page.getByRole('button', { name: 'Back to results' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Branches and ATMs' })).toBeVisible()
    await expect(openButton(firstCard)).toBeFocused()
  })

})

test.describe('opening a card', () => {
  test('a click anywhere on the card opens it, and the address is only on the details', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').first()
    await expect(card).toBeVisible()
    const name = await card.getByRole('heading').textContent()
    // The full address, which ends in a four-digit postcode, is not on the card.
    await expect(card).not.toContainText(/\b\d{4}\b/)

    // Click the badge with the real mouse, a long way from the name. Playwright's own click refuses,
    // because the stretched name button covers the badge, which is exactly the design.
    const badge = (await card.locator('.type-badge').boundingBox())!
    await page.mouse.click(badge.x + badge.width / 2, badge.y + badge.height / 2)

    await expect(page.getByRole('heading', { level: 1, name: name! })).toBeVisible()
    await expect(page.locator('.branch-detail__address')).toHaveText(/\d{4}$/)
  })

  test('has no separate Details button', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    await expect(page.getByRole('button', { name: /Details/ })).toHaveCount(0)
  })

  test('Directions and Call on a card do not open it', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').first()
    await expect(card).toBeVisible()

    const call = card.getByRole('link', { name: /^Call/ })
    await call.evaluate((link) => link.addEventListener('click', (event) => event.preventDefault()))
    await call.click()

    await expect(page.getByRole('heading', { level: 1, name: 'Branches and ATMs' })).toBeAttached()
    await expect(page.getByRole('button', { name: 'Back to results' })).toHaveCount(0)
  })

  test('the details take the whole sidebar, and the search comes back on return', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    await searchField(page).fill('pretoria')
    await page.keyboard.press('Enter')
    await expect(searchField(page)).toBeVisible()
    await page.getByRole('button', { name: 'Filters' }).click()
    await expect(page.getByRole('group', { name: 'Show' })).toBeVisible()

    await openButton(page.getByRole('article').first()).click()

    await expect(page.getByRole('button', { name: 'Back to results' })).toBeVisible()
    await expect(searchField(page)).toBeHidden()
    await expect(page.getByRole('group', { name: 'Show' })).toBeHidden()
    await expect(page.getByRole('img', { name: 'Capitec' })).toBeHidden()

    await page.getByRole('button', { name: 'Back to results' }).click()

    await expect(searchField(page)).toBeVisible()
    await expect(searchField(page)).toHaveValue('pretoria')
    await expect(page.getByRole('group', { name: 'Show' })).toBeVisible()
  })

  test('on a desktop the details fill the sidebar from top to bottom', async ({ page, isMobile }) => {
    test.skip(isMobile, 'The sidebar is a sheet on a phone')
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    await openButton(page.getByRole('article').first()).click()

    const box = await page.locator('.locator__results').boundingBox()
    const viewport = page.viewportSize()!
    expect(box!.y).toBeLessThanOrEqual(1)
    expect(box!.height).toBeGreaterThanOrEqual(viewport.height - 1)
  })
})

test.describe('keyboard', () => {
  test('tab reaches a card on its name, and Enter opens it', async ({ page }) => {
    await page.goto('/')
    const card = page.getByRole('article').first()
    await expect(card).toBeVisible()
    const name = await card.getByRole('heading').textContent()

    await openButton(card).focus()
    await page.keyboard.press('Enter')

    await expect(page.getByRole('heading', { level: 1, name: name! })).toBeFocused()
  })

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

test.describe('search suggestions', () => {
  test('suggest places and branches as the user types, and a chosen place narrows the list', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    const all = await resultCount(page)

    await searchField(page).fill('pretor')

    const list = page.getByRole('listbox', { name: 'Suggestions' })
    await expect(list).toBeVisible()
    await expect(list.getByRole('group', { name: 'Places' })).toBeVisible()
    await expect(list.getByRole('group', { name: 'Branches and ATMs' })).toBeVisible()

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(list).toBeHidden()
    await expect(searchField(page)).toHaveValue(/^Pretoria/)
    await expect.poll(() => resultCount(page)).toBeLessThan(all)
  })

  test('choosing a branch suggestion opens that branch', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    await searchField(page).fill('Alexandra Yarona')
    await page.getByRole('option', { name: /Capitec Bank Alexandra Yarona/ }).click()

    await expect(page.getByRole('heading', { level: 1, name: 'Capitec Bank Alexandra Yarona' })).toBeVisible()
    await expect(page.getByRole('listbox')).toBeHidden()
  })

  test('close on Escape, and the clear button empties the search', async ({ page }) => {
    await page.goto('/')
    await searchField(page).fill('pretor')
    await expect(page.getByRole('listbox')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('listbox')).toBeHidden()
    await expect(searchField(page)).toHaveValue('pretor')

    await page.getByRole('button', { name: 'Clear search' }).first().click()
    await expect(searchField(page)).toHaveValue('')
    await expect(searchField(page)).toBeFocused()
  })

  test('are not offered for a single character', async ({ page }) => {
    await page.goto('/')

    await searchField(page).fill('p')

    await expect(page.getByRole('listbox')).toHaveCount(0)
  })
})
