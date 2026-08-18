import { expect, test } from '@playwright/test'

import { signInBusinessPortal } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

test.describe('business owner workflow smoke test', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true or run npm run test:e2e:workflows after local Supabase is seeded.')

  test('owner can sign in and open owner business pages', async ({ page }) => {
    await signInBusinessPortal(page, e2eAccounts.businessOwner)

    for (const path of [
      '/business/products',
      '/business/rewards',
      '/business/promotions',
      '/business/gift-cards',
      '/business/accounting',
      '/business/members',
      '/business/settings',
    ]) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
      await expect(page.locator('body')).not.toContainText(/application error|something went wrong|page not found/i)
    }
  })

  test('accounting report is readable and compact on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/accounting')

    await expect(page).toHaveURL(/\/business\/accounting$/)
    await expect(page.getByTestId('business-accounting-report')).toBeVisible()
    await expect(page.getByRole('heading', { name: /credit and reimbursement report/i })).toBeVisible()
    await expect(page.locator('input[type="date"]')).toHaveCount(2)
    await expect(page.locator('body')).not.toContainText(/accounting report could not be loaded|application error|something went wrong/i)

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(horizontalOverflow).toBeLessThanOrEqual(2)
  })
})
