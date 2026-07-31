import { expect, test, type Page } from '@playwright/test'

const publicEntryPoints = [
  '/',
  '/landing-page',
  '/business',
  '/cost-calculator',
  '/shop',
  '/promotions',
  '/ambassadors',
  '/invitation',
  '/signin',
  '/join',
  '/terms',
  '/privacy',
  '/reward-terms',
  '/verification-policy',
] as const

function monitorRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(message.text())
    }
  })
  return errors
}

test('public navigation has no empty links, missing fragments, or dead internal destinations', async ({ page }) => {
  const errors = monitorRuntimeErrors(page)
  const destinations = new Set<string>()

  for (const entryPoint of publicEntryPoints) {
    await page.goto(entryPoint)
    await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)

    const links = await page.locator('a').evaluateAll((anchors) => anchors.map((anchor) => ({
      href: anchor.getAttribute('href'),
      text: anchor.textContent?.trim() ?? '',
    })))

    for (const link of links) {
      expect(link.href, `Empty link on ${entryPoint}: ${link.text || '(no text)'}`).toBeTruthy()
      if (!link.href) continue

      if (link.href.startsWith('#')) {
        expect(
          await page.evaluate((id) => document.getElementById(id) !== null, link.href.slice(1)),
          `Missing fragment ${link.href} on ${entryPoint}`,
        ).toBe(true)
      } else if (link.href.startsWith('/')) {
        destinations.add(link.href)
      }
    }
  }

  for (const destination of destinations) {
    await page.goto(destination)
    await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)
  }

  expect(errors).toEqual([])
})
