import { expect, test } from '@playwright/test'

const roleIsolationEnabled = process.env.E2E_ROLE_ISOLATION_CHECK === 'true'
const password = process.env.E2E_ROLE_ISOLATION_PASSWORD ?? 'Rewards 123!'
const memberEmail = process.env.E2E_ROLE_ISOLATION_MEMBER_EMAIL ?? 'member@rewardme.test'
const businessEmail = process.env.E2E_ROLE_ISOLATION_BUSINESS_EMAIL ?? 'owner@rewardme.test'
const adminEmail = process.env.E2E_ROLE_ISOLATION_ADMIN_EMAIL ?? 'admin@rewardsplatform.test'

async function expectAutomaticRoleRoute(
  page: import('@playwright/test').Page,
  email: string,
  expectedPath: RegExp,
) {
  await page.goto('/signin', { waitUntil: 'domcontentloaded' })
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await page.getByRole('form', { name: 'Sign in' })
    .locator('button[type="submit"]')
    .click()

  await expect(page).toHaveURL(expectedPath, { timeout: 15_000 })
}

test.describe.serial('automatic sign-in role routing', () => {
  test.skip(!roleIsolationEnabled, 'Enable only with the private QA account credentials.')

  test('customer credentials open the customer workspace', async ({ page }) => {
    await expectAutomaticRoleRoute(page, memberEmail, /\/dashboard$/)
  })

  test('business credentials open the business workspace', async ({ page }) => {
    await expectAutomaticRoleRoute(page, businessEmail, /\/business\/dashboard$/)
  })

  test('admin credentials open the admin workspace', async ({ page }) => {
    await expectAutomaticRoleRoute(page, adminEmail, /\/admin\/portal$/)
  })
})
