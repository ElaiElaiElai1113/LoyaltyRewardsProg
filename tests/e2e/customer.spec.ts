import { expect, test } from '@playwright/test'

import { signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

test.describe('customer workflow smoke test', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true or run npm run test:e2e:workflows after local Supabase is seeded.')

  test('customer can sign in and open core member pages', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.customer)

    await page.goto('/shop')
    await expect(page.locator('body')).toContainText(/Partner Map|Explore Businesses/i)
    await expect(page).toHaveURL(/\/shop$/)

    for (const path of ['/rewards', '/membership', '/profile', '/cart']) {
      await page.goto(path)
      await expect(page.locator('body')).toContainText('Medellin Rewards')
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    }
  })

  test('unverified customer is blocked from reward value actions', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.unverifiedCustomer)

    await page.goto('/rewards')
    await expect(page.locator('body')).toContainText(/Verify ID to redeem|Verifica tu ID para canjear|Verification required/i)

    await page.goto('/gift-cards')
    await expect(page.locator('body')).toContainText(/Verify ID to issue|Verifica tu ID para emitir|Verification required|Tu ID fue enviado/i)
  })
})
