import { expect, test } from '@playwright/test'

const routes = ['/', '/business', '/join', '/signin']

test.describe('public performance and accessibility acceptance', () => {
  for (const route of routes) {
    test(`${route} stays responsive, labelled, and free of runtime failures`, async ({ page }) => {
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      page.on('response', (response) => {
        if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`)
      })

      const started = Date.now()
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.locator('main, form').first().waitFor()
      // The first local Vite route includes cold dependency transformation.
      expect(Date.now() - started).toBeLessThan(route === '/' ? 20_000 : 10_000)
      expect(errors).toEqual([])

      const documentChecks = await page.evaluate(() => ({
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        missingImageAlt: [...document.images].some((image) => !image.hasAttribute('alt')),
        unnamedButtons: [...document.querySelectorAll('button')].some((button) => {
          const label = button.getAttribute('aria-label') ?? button.textContent ?? ''
          return !label.trim()
        }),
        headingCount: document.querySelectorAll('h1').length,
      }))
      expect(documentChecks).toEqual({
        horizontalOverflow: false,
        missingImageAlt: false,
        unnamedButtons: false,
        headingCount: 1,
      })
    })
  }

  test('home photography uses optimized delivery formats', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    const sources = await page.locator('main img').evaluateAll((images) => images.map((image) => (image as HTMLImageElement).currentSrc))
    const marketing = sources.filter((source) => /(car-rewards-clean|coffee-member|coffee-rewards|dinner-rewards|real-estate-rewards|salon-rewards)/.test(source))
    expect(marketing.length).toBeGreaterThan(0)
    expect(marketing.every((source) => source.includes('.webp'))).toBe(true)
  })
})
