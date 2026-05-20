import { expect, test } from '@playwright/test'

test.describe('public acquisition workflow', () => {
  test('landing page and early access page render', async ({ page }) => {
    await page.goto('/landing-page')
    await expect(page.locator('body')).toContainText('Medellin Rewards')
    await expect(page.locator('#why-join')).toBeVisible()
    await expect(page.locator('#early-benefits')).toBeVisible()
    await expect(page.locator('#rewards-system')).toBeVisible()
    await expect(page.locator('#membership')).toBeVisible()

    await page.goto('/early-access')
    await expect(page.locator('body')).toContainText('Medellin Rewards')
    await expect(page.locator('body')).toContainText(/Suscribirse|Subscribe/i)
  })
})
