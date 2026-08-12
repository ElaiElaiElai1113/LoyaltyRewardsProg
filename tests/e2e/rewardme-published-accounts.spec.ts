import { expect, test } from '@playwright/test'

const accountCheckEnabled = process.env.E2E_REWARDME_PUBLIC_ACCOUNT_CHECK === 'true'
const password = process.env.E2E_PASSWORD ?? 'Rewards 123!'

const accounts = [
  {
    label: 'member',
    route: '/signin',
    email: process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test',
    emailInput: '#signin-email',
    passwordInput: '#signin-password',
    destination: /\/(?:dashboard|agreements\/required)(?:[/?#]|$)/,
    rewardMeBranded: true,
  },
  {
    label: 'business owner',
    route: '/business/login',
    email: process.env.E2E_REWARDME_BUSINESS_OWNER_EMAIL ?? 'owner@rewardme.test',
    emailInput: '#staff-signin-email',
    passwordInput: '#staff-signin-password',
    destination: /\/(?:business\/dashboard|agreements\/required)(?:[/?#]|$)/,
    rewardMeBranded: true,
  },
  {
    label: 'business staff',
    route: '/business/login',
    email: process.env.E2E_REWARDME_BUSINESS_STAFF_EMAIL ?? 'staff@rewardme.test',
    emailInput: '#staff-signin-email',
    passwordInput: '#staff-signin-password',
    destination: /\/(?:business\/dashboard|agreements\/required)(?:[/?#]|$)/,
    rewardMeBranded: true,
  },
  {
    label: 'platform administrator',
    route: '/admin',
    email: process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test',
    emailInput: '#staff-signin-email',
    passwordInput: '#staff-signin-password',
    destination: /\/admin\/portal(?:[/?#]|$)/,
    rewardMeBranded: false,
  },
] as const

test.describe('published RewardMe test accounts', () => {
  test.skip(
    !accountCheckEnabled,
    'Set E2E_REWARDME_PUBLIC_ACCOUNT_CHECK=true to verify the deliberately published QA logins.',
  )

  for (const account of accounts) {
    test(`${account.label} account signs in from the published credential panel`, async ({ page }) => {
      const runtimeErrors: string[] = []
      await page.setViewportSize({ width: 390, height: 844 })
      page.on('pageerror', (error) => runtimeErrors.push(error.message))
      page.on('console', (message) => {
        if (message.type() === 'error') runtimeErrors.push(message.text())
      })

      const response = await page.goto(account.route, { waitUntil: 'domcontentloaded' })
      expect(response?.ok()).toBeTruthy()

      const credentials = page.getByTestId('rewardme-test-credentials')
      await expect(credentials).toBeVisible()
      const accountCard = credentials.locator('article').filter({ hasText: account.email })
      await expect(accountCard).toBeVisible()
      await accountCard.getByRole('button', { name: 'Use account' }).click()
      await expect(page.locator(account.emailInput)).toHaveValue(account.email)
      await expect(page.locator(account.passwordInput)).toHaveValue(password)

      const form = page.locator('form').filter({ has: page.locator(account.emailInput) })
      await form.getByRole('button', { name: /sign in/i }).click()
      const loginError = page.getByText(/invalid login credentials|unable to sign in/i).first()
      await Promise.race([
        page.waitForURL(account.destination, { timeout: 15_000 }),
        loginError.waitFor({ state: 'visible', timeout: 15_000 }).then(async () => {
          throw new Error(`${account.label} login failed: ${await loginError.textContent()}`)
        }),
      ])
      await expect(page).toHaveURL(account.destination, { timeout: 15_000 })
      await expect(page.locator('main')).toBeVisible()
      await page.waitForTimeout(1_500)
      await expect(page.locator('body')).not.toContainText(/invalid login credentials/i)
      if (account.rewardMeBranded) {
        await expect(page.locator('body')).not.toContainText(/\bpinas\b/i)
      }

      if (account.label === 'member' && /\/dashboard(?:[/?#]|$)/.test(page.url())) {
        await page.goto('/membership', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('[data-membership-request-panel]')).toBeVisible()
        await expect(page.locator('body')).not.toContainText('Membership details could not be loaded.')
      }
      if (account.label === 'platform administrator') {
        await page.goto('/admin/memberships', { waitUntil: 'domcontentloaded' })
        await expect(page.locator('[data-membership-operations]')).toBeVisible()
        await expect(page.locator('body')).not.toContainText('Operations data could not be loaded.')
      }

      const pageIntegrity = await page.evaluate(() => ({
        emptyLinks: [...document.querySelectorAll('a')].filter((link) => {
          const href = link.getAttribute('href')
          return href === null || href.trim() === '' || href.trim() === '#'
        }).length,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        visibleRuntimeError: /application error|unexpected error|something went wrong/i.test(document.body.innerText),
      }))
      expect(pageIntegrity).toEqual({ emptyLinks: 0, overflow: false, visibleRuntimeError: false })
      expect(runtimeErrors).toEqual([])
    })
  }
})
