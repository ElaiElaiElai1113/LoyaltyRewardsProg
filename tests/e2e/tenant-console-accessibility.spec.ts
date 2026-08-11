import { expect, test } from '@playwright/test'

const routes = [
  '/admin/programs',
  '/admin/readiness',
  '/admin/import',
  '/program/settings?tenant=guatemala',
  '/program/team?tenant=synergize',
  '/program/reports?tenant=pinas',
  '/onboarding/program?tenant=guatemala',
]

test.describe('tenant operations responsive access gates', () => {
  for (const route of routes) {
    test(`${route} has no mobile overflow and preserves its tenant`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 720 })
      await page.goto(route)
      await expect(page.locator('main')).toBeVisible()
      const dimensions = await page.evaluate(() => ({
        body: document.body.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }))
      expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1)
      if (route.includes('tenant=')) {
        const tenant = new URL(`http://local${route}`).searchParams.get('tenant')
        await expect(page).toHaveURL(new RegExp(`tenant=${tenant}`))
      }
    })
  }
})
