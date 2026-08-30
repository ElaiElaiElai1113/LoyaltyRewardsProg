import { expect, test } from '@playwright/test'

const roleIsolationEnabled = process.env.E2E_ROLE_ISOLATION_CHECK === 'true'
const password = process.env.E2E_ROLE_ISOLATION_PASSWORD ?? 'Rewards 123!'
const memberEmail = process.env.E2E_ROLE_ISOLATION_MEMBER_EMAIL ?? 'member@rewardme.test'
const businessEmail = process.env.E2E_ROLE_ISOLATION_BUSINESS_EMAIL ?? 'owner@rewardme.test'
const adminEmail = process.env.E2E_ROLE_ISOLATION_ADMIN_EMAIL ?? 'admin@rewardsplatform.test'

async function expectRejectedRole(
  page: import('@playwright/test').Page,
  portal: 'admin' | 'business' | 'customer',
  email: string,
  expectedMessage: string,
) {
  await page.goto(`/signin?portal=${portal}`, { waitUntil: 'domcontentloaded' })
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await page.getByRole('form', { name: `Sign in as ${portal[0].toUpperCase()}${portal.slice(1)}` })
    .locator('button[type="submit"]')
    .click()

  await expect(page.getByText(expectedMessage, { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(new RegExp(`/signin\\?portal=${portal}$`))
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await expect(page).not.toHaveURL(/\/dashboard$/)
}

test.describe.serial('unified sign-in role isolation', () => {
  test.skip(!roleIsolationEnabled, 'Enable only with the private QA account credentials.')

  test('customer accounts cannot enter the business choice', async ({ page }) => {
    await expectRejectedRole(
      page,
      'business',
      memberEmail,
      'This account does not have access to the business portal.',
    )
  })

  test('business accounts cannot enter the customer choice', async ({ page }) => {
    await expectRejectedRole(
      page,
      'customer',
      businessEmail,
      'This account does not have access to the customer portal.',
    )
  })

  test('non-admin accounts cannot enter the admin choice', async ({ page }) => {
    await expectRejectedRole(
      page,
      'admin',
      memberEmail,
      'This account does not have access to the admin portal.',
    )
  })

  test('admin accounts cannot enter the customer choice', async ({ page }) => {
    await expectRejectedRole(
      page,
      'customer',
      adminEmail,
      'This account does not have access to the customer portal.',
    )
  })
})
