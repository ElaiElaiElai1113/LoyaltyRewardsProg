import { expect, test } from '@playwright/test'

const accountCheckEnabled = process.env.E2E_REWARDME_PUBLIC_ACCOUNT_CHECK === 'true'
const isWondertown = (process.env.E2E_BASE_URL ?? '').toLowerCase().includes('wondertown')

const accounts = [
  {
    label: 'member',
    buttonLabel: 'Customer',
    route: '/signin',
    destination: /\/(?:dashboard|agreements\/required)(?:[/?#]|$)/,
    rewardMeBranded: true,
  },
  {
    label: 'business owner',
    buttonLabel: 'Business',
    route: '/signin',
    destination: /\/(?:business\/dashboard|agreements\/required)(?:[/?#]|$)/,
    rewardMeBranded: true,
  },
  {
    label: 'platform administrator',
    buttonLabel: 'Admin',
    route: '/signin',
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

      await expect(page.getByRole('button')).toHaveCount(3)
      await page.getByRole('button', { name: `Sign in as ${account.buttonLabel}`, exact: true }).click()
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
        if (isWondertown) {
          await expect(page.getByRole('heading', { name: 'Monthly Membership' })).toBeVisible()
        } else {
          await expect(page.locator('[data-membership-request-panel]')).toBeVisible()
        }
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
