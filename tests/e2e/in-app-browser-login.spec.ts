import { expect, test, type Page } from '@playwright/test'

const accountCheckEnabled = process.env.E2E_IN_APP_BROWSER_ACCOUNT_CHECK === 'true'

const sites = [
  {
    name: 'Wondertown',
    origin: process.env.E2E_WONDERTOWN_URL ?? 'https://wondertown-rewards.vercel.app',
    credentialsTestId: 'wondertown-test-credentials',
    email: process.env.E2E_WONDERTOWN_CUSTOMER_EMAIL ?? 'member@wondertown.test',
  },
  {
    name: 'RewardMe',
    origin: process.env.E2E_REWARDME_URL ?? 'https://rewardme-prod.vercel.app',
    credentialsTestId: 'rewardme-test-credentials',
    email: process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test',
  },
] as const

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

test.use({
  hasTouch: true,
  isMobile: true,
  userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/UQ1A.240205.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/124.0.6367.179 Mobile Safari/537.36 WhatsApp/2.24.16.76',
  viewport: { width: 390, height: 844 },
})

test.describe('WhatsApp-style in-app browser login', () => {
  test.skip(
    !accountCheckEnabled,
    'Set E2E_IN_APP_BROWSER_ACCOUNT_CHECK=true to verify the deliberately published QA logins.',
  )

  for (const site of sites) {
    test(`${site.name} member signs in with one tap`, async ({ page }) => {
      const runtimeErrors = collectRuntimeErrors(page)
      const response = await page.goto(
        `${site.origin}/signin?utm_source=whatsapp&utm_medium=chat`,
        { waitUntil: 'domcontentloaded' },
      )

      expect(response?.status()).toBeLessThan(400)
      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/rewards program not found/i)

      const credentials = page.getByTestId(site.credentialsTestId)
      await expect(credentials).toBeVisible()
      const accountCard = credentials.locator('article').filter({ hasText: site.email })
      await accountCard.getByRole('button', { name: 'Sign in as Member' }).click()

      const loginError = page.getByText(/invalid login credentials|unable to sign in/i).first()
      await Promise.race([
        page.waitForURL(/\/(?:dashboard|agreements\/required)(?:[/?#]|$)/, { timeout: 15_000 }),
        loginError.waitFor({ state: 'visible', timeout: 15_000 }).then(async () => {
          throw new Error(`${site.name} login failed: ${await loginError.textContent()}`)
        }),
      ])

      await expect(page.locator('main')).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/invalid login credentials/i)

      const integrity = await page.evaluate(() => ({
        emptyLinks: [...document.querySelectorAll('a')].filter((link) => {
          const href = link.getAttribute('href')
          return href === null || href.trim() === '' || href.trim() === '#'
        }).length,
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        visibleFatalError: /application error|page crashed|something went wrong/i.test(document.body.innerText),
      }))

      expect(integrity).toEqual({ emptyLinks: 0, overflow: 0, visibleFatalError: false })
      expect(runtimeErrors).toEqual([])
    })
  }
})
