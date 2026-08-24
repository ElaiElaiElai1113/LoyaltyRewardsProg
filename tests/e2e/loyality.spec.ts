import { expect, test, type Page } from '@playwright/test'

function runtimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  return errors
}

test.describe('Loyality public product', () => {
  for (const viewport of [
    { name: 'phone', width: 360, height: 780 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`landing page is complete and responsive on ${viewport.name}`, async ({ page }) => {
      const errors = runtimeErrors(page)
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/?tenant=loyality')

      await expect(page).toHaveTitle('Loyality')
      await expect(page.getByRole('heading', { name: 'Turn every visit into the next one.' })).toBeVisible()
      await expect(page.getByText('No POS integration')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'A specific promise—not a confusing cash balance.' })).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/RewardMe|Wondertown|Medellin|Guatemala/i)

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        emptyLinks: Array.from(document.querySelectorAll('a[href]')).filter((anchor) => !anchor.getAttribute('href')?.trim()).length,
      }))
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1)
      expect(layout.emptyLinks).toBe(0)
      expect(errors).toEqual([])
    })
  }

  test('business and customer calls to action have real destinations', async ({ page }) => {
    await page.goto('/?tenant=loyality')
    await expect(page.getByRole('link', { name: 'Join as a customer' })).toHaveAttribute('href', '/join')
    await expect(page.getByRole('link', { name: 'Business sign in' })).toHaveAttribute('href', '/signin?portal=business')
    await page.getByRole('link', { name: 'Business sign in' }).click()
    await expect(page).toHaveURL(/\/signin\?portal=business/)
    await expect(page.getByRole('button', { name: 'Sign in as Business', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  for (const viewport of [
    { name: 'phone', width: 360, height: 780 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`sign in and join continue the Loyality visual system on ${viewport.name}`, async ({ page }) => {
      const errors = runtimeErrors(page)
      await page.setViewportSize(viewport)

      await page.goto('/signin?tenant=loyality&portal=customer')
      await expect(page.locator('html')).toHaveAttribute('data-program', 'loyality')
      await expect(page.getByRole('heading', { name: 'Return. Recognized. Rewarded.' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Step into your loop.' })).toBeVisible()
      await expect(page.locator('.ly-auth')).toBeVisible()
      await expect(page.locator('.soft-luxe-shell')).toHaveCount(0)

      await page.goto('/join?tenant=loyality')
      await expect(page.getByRole('heading', { name: 'Join the loop.' })).toBeVisible()
      await expect(page.getByLabel('Full name')).toBeVisible()
      await expect(page.locator('.ly-auth')).toBeVisible()

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
      }))
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1)
      expect(errors).toEqual([])
    })
  }
})
