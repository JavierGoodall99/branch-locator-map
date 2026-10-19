import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test, searchField, openButton } from './fixtures'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/**
 * Capitec's brand blue (#2f70ef) is 4.48:1 against white, just under the 4.5:1 WCAG AA threshold
 * for text this size. We match their palette on purpose and document the trade-off in design.md,
 * so this one colour pair at this ratio is allowed. Any other contrast problem, or this pair
 * getting worse, still fails.
 */
const BRAND_BLUE = '#2f70ef'
const BRAND_BLUE_MIN_RATIO = 4.4

type ContrastData = { fgColor?: string; bgColor?: string; contrastRatio?: number }

function isKnownBrandBlueNearMiss(data: ContrastData | undefined): boolean {
  if (!data || data.contrastRatio === undefined) return false
  return data.contrastRatio >= BRAND_BLUE_MIN_RATIO && [data.fgColor, data.bgColor].includes(BRAND_BLUE)
}

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()

  return (
    results.violations
      .map((violation) => ({
        rule: violation.id,
        impact: violation.impact,
        help: violation.help,
        nodes: violation.nodes
          .filter((node) => violation.id !== 'color-contrast' || !isKnownBrandBlueNearMiss(node.any[0]?.data))
          .map((node) => node.target.join(' ')),
      }))
      // Show what failed in the test report, not just that something did.
      .filter((violation) => violation.nodes.length > 0)
  )
}

test.describe('accessibility', () => {
  // Scanning the whole list, which has about 190 cards, takes a while, more so with several browsers at once.
  test.describe.configure({ timeout: 90_000 })

  test('the results list has no WCAG A or AA violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()

    expect(await scan(page)).toEqual([])
  })

  test('a branch’s details have no WCAG A or AA violations', async ({ page }) => {
    await page.goto('/')
    await openButton(page.getByRole('article').first()).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Opening hours' })).toBeVisible()

    expect(await scan(page)).toEqual([])
  })

  test('the distances, with one chosen, have no WCAG A or AA violations', async ({ page, context }) => {
    await context.grantPermissions(['geolocation'])
    await context.setGeolocation({ latitude: -33.9249, longitude: 18.4241 })
    await page.goto('/')
    // The page finds the location on arrival, which chooses 25 km.
    await expect(page.getByRole('button', { name: '25 km' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('article').first()).toBeVisible()

    expect(await scan(page)).toEqual([])
  })

  test('the distances, with the location refused, have no WCAG A or AA violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    await expect(page.getByRole('button', { name: '10 km' })).toBeEnabled()

    expect(await scan(page)).toEqual([])
  })

  test('the Filters window has no WCAG A or AA violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    await page.getByRole('button', { name: 'Filters' }).click()
    await expect(page.getByRole('dialog', { name: 'Filters' })).toBeVisible()
    await page.getByRole('dialog', { name: 'Filters' }).getByRole('button', { name: 'Gauteng' }).click()

    expect(await scan(page)).toEqual([])
  })

  test('the no-matches message has no WCAG A or AA violations', async ({ page }) => {
    await page.goto('/')
    await searchField(page).fill('zzzz nowhere')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { name: 'No matches found' })).toBeVisible()

    expect(await scan(page)).toEqual([])
  })

  test('the search suggestions are valid and have no WCAG A or AA violations while open', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    await searchField(page).fill('pretor')
    await expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeVisible()
    await page.keyboard.press('ArrowDown')

    expect(await scan(page)).toEqual([])
  })

  test('the page is usable at 200% zoom without sideways scrolling', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('article').first()).toBeVisible()
    await page.setViewportSize({ width: 640, height: 450 })

    const scrollsSideways = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    )
    expect(scrollsSideways).toBe(false)
  })
})
