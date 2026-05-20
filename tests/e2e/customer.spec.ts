import { expect, test } from '@playwright/test'

import { signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

test.describe('customer workflow smoke test', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true or run npm run test:e2e:workflows after local Supabase is seeded.')

  test('customer can sign in and open core member pages', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.customer)

    for (const path of ['/shop', '/rewards', '/membership', '/profile', '/cart']) {
      await page.goto(path)
      await expect(page.locator('body')).toContainText('Medellin Rewards')
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    }
  })
})
