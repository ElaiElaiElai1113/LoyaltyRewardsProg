import { expect, test, type Page } from '@playwright/test'

const tenants = [
  { slug: 'medellin', name: 'Medellin Rewards', color: '#9c6a22' },
  { slug: 'guatemala', name: 'Guatemala Rewards', color: '#176b5b' },
  { slug: 'synergize', name: 'Synergize', color: '#2357a5' },
  {
    slug: 'pinas',
    name: 'RewardMe',
    color: '#b8862e',
    heading: 'Earn amazing rewards while supporting local businesses.',
  },
  {
    slug: 'pinasrewards',
    name: 'Pinas Rewards',
    color: '#a67608',
    heading: 'Earn Amazing Rewards While Supporting Local Businesses',
  },
  {
    slug: 'wondertown',
    name: 'Wondertown Rewards',
    color: '#e57267',
    heading: 'Every little thing feels rewarding.',
  },
  {
    slug: 'loyality',
    name: 'Loyality',
    color: '#173b3f',
    heading: 'Your loyalty card, reimagined.',
  },
] as const

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText ?? 'request failed'}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  return errors
}

test.describe('white-label tenant resolution', () => {
  for (const tenant of tenants) {
    test(`${tenant.name} loads isolated branding without runtime errors`, async ({ page }) => {
      const errors = collectRuntimeErrors(page)
      await page.addInitScript((slug) => window.localStorage.setItem(`rewards:${slug}:language`, 'en'), tenant.slug)
      await page.goto(`/?tenant=${tenant.slug}`)

      await expect(page).toHaveTitle(tenant.name)
      if (tenant.slug === 'loyality') {
        await expect(page.locator('.reference-loyality__logo')).toHaveText('Loyality')
      } else if (tenant.slug === 'wondertown') {
        await expect(page.locator('.wondertown-home__brand').first()).toContainText('WondertownRewards')
      } else if (tenant.slug === 'pinas') {
        await expect(page.locator('.reference-rewardme__logo').first()).toHaveText('RewardMe')
      } else {
        await expect(page.locator('.figma-home__brand').first()).toContainText(tenant.name.toUpperCase())
      }
      await expect(
        page.getByRole('heading', {
          name: 'heading' in tenant ? tenant.heading : 'Earn Amazing Rewards While Supporting Local Businesses',
        }),
      ).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/\bheadline\b/i)
      await expect(page.locator('html')).toHaveCSS('--tenant-accent', tenant.color)
      await expect(page.locator('body')).not.toContainText('Loading rewards program...')
      const landingHeader = page.locator(
        tenant.slug === 'loyality'
          ? '.reference-loyality__nav'
          : tenant.slug === 'wondertown'
            ? '.wondertown-home__header'
            : tenant.slug === 'pinas'
            ? '.reference-rewardme__header'
            : '.figma-home__header',
      )
      await expect(landingHeader).toHaveCSS('position', 'sticky')
      await page.evaluate(() => window.scrollTo(0, Math.min(700, document.body.scrollHeight)))
      await expect.poll(() => landingHeader.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0)
      expect(errors).toEqual([])

      await page.reload()
      await expect(page).toHaveTitle(tenant.name)
      if (tenant.slug !== 'pinas') {
        await expect(page.locator('body')).not.toContainText('RewardMe')
      }
    })

    test(`${tenant.name} identifies the platform-admin choice inside the unified sign-in entry`, async ({ page }) => {
      const errors = collectRuntimeErrors(page)
      await page.addInitScript((slug) => window.localStorage.setItem(`rewards:${slug}:language`, 'en'), tenant.slug)
      await page.goto(`/admin?tenant=${tenant.slug}`)

      await expect(page).toHaveURL(new RegExp(`/signin\\?tenant=${tenant.slug}&portal=admin`))
      if (tenant.slug === 'loyality') {
        await expect(page).toHaveTitle('Loyality')
        await expect(page.getByRole('form', { name: 'Sign in to Loyality' })).toBeVisible()
        await expect(page.locator('#loyality-email')).toBeVisible()
        await expect(page.locator('body')).not.toContainText('Rewards Platform')
      } else if (tenant.slug === 'wondertown') {
        await expect(page).toHaveTitle('Rewards Platform Admin')
        await expect(page.getByRole('button')).toHaveCount(3)
        await expect(page.locator('#signin-email')).toHaveCount(0)
      } else if (tenant.slug === 'pinas') {
        await expect(page).toHaveTitle('Rewards Platform Admin')
        await expect(page.locator('#signin-email')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Sign in as Admin', exact: true })).toHaveAttribute('aria-pressed', 'true')
      } else {
        await expect(page).toHaveTitle('Rewards Platform Admin')
        await expect(page.getByText('Rewards Platform', { exact: true })).toBeVisible()
        await expect(page.locator('#signin-email')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Sign in as Admin', exact: true })).toHaveAttribute('aria-pressed', 'true')
      }
      await expect(page.getByText(tenant.name, { exact: false }).first()).toBeVisible()
      expect(errors).toEqual([])
    })

    test(`${tenant.name} keeps the business entry tenant branded`, async ({ page }) => {
      const errors = collectRuntimeErrors(page)
      await page.addInitScript((slug) => window.localStorage.setItem(`rewards:${slug}:language`, 'en'), tenant.slug)
      await page.goto(`/business/login?tenant=${tenant.slug}`)

      await expect(page).toHaveTitle(tenant.name)
      await expect(page.getByText(tenant.name, { exact: true })).toBeVisible()
      await expect(page).toHaveURL(new RegExp(`/signin\\?tenant=${tenant.slug}&portal=business`))
      if (tenant.slug === 'loyality') {
        await expect(page.getByRole('form', { name: 'Sign in to Loyality' })).toBeVisible()
        await expect(page.locator('#loyality-email')).toBeVisible()
      } else if (tenant.slug === 'wondertown') {
        await expect(page.getByRole('button')).toHaveCount(3)
        await expect(page.locator('#signin-email')).toHaveCount(0)
      } else if (tenant.slug === 'pinas') {
        await expect(page.locator('#signin-email')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Sign in as Business', exact: true })).toHaveAttribute('aria-pressed', 'true')
      } else {
        await expect(page.locator('#signin-email')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Sign in as Business', exact: true })).toHaveAttribute('aria-pressed', 'true')
      }
      await expect(page.locator('body')).not.toContainText('Rewards Platform')
      expect(errors).toEqual([])
    })
  }

  test('tenant selection survives navigation to the public business catalog', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/?tenant=pinas')
    await page.locator('a[href="/business"]').first().click()
    await expect(page).toHaveURL(/\/business/)
    await expect(page).toHaveTitle('RewardMe')
    expect(errors).toEqual([])
  })

  test('platform program console remains protected for signed-out visitors', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/admin/programs')
    await expect(page).toHaveURL(/\/signin\?portal=admin&redirect=%2Fadmin%2Fprograms$/)
    await expect(page.locator('#signin-email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in as Admin', exact: true })).toHaveAttribute('aria-pressed', 'true')
    expect(errors).toEqual([])
  })

  test('tenant administration remains protected for signed-out visitors', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/program/settings?tenant=guatemala')
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fprogram%2Fsettings&tenant=guatemala$/)
    await expect(page.locator('#signin-email')).toBeVisible()
    await expect(page).toHaveTitle('Guatemala Rewards')
    expect(errors).toEqual([])
  })

  test('self-service program onboarding requires authentication', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/onboarding/program?tenant=pinas')
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fonboarding%2Fprogram&tenant=pinas/)
    await expect(page.locator('#signin-email')).toBeVisible()
    await expect(page).toHaveTitle('RewardMe')
    expect(errors).toEqual([])
  })

  test('early-access copy follows the selected tenant', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/invitation?tenant=guatemala')
    await expect(page).toHaveTitle('Guatemala Rewards')
    await expect(page.locator('main')).toContainText('Guatemala Rewards')
    await expect(page.locator('main')).not.toContainText('Medellin Rewards')
    expect(errors).toEqual([])
  })

  for (const tenant of tenants.filter((candidate) => candidate.slug !== 'medellin')) {
    test(`${tenant.name} never renders Medellin text, imagery, or links`, async ({ page }) => {
      const publicRoutes = ['/', '/guide', '/shop', '/business', '/signin', '/promo/register']
      await page.addInitScript((slug) => window.localStorage.setItem(`rewards:${slug}:language`, 'en'), tenant.slug)

      for (const route of publicRoutes) {
        const response = await page.goto(`${route}?tenant=${tenant.slug}`, { waitUntil: 'domcontentloaded' })
        expect(response?.status(), `${tenant.name} ${route}`).toBeLessThan(400)
        await page.locator('body').waitFor()

        const renderedBranding = await page.evaluate(() => {
          const attributeValues = Array.from(document.querySelectorAll<HTMLElement>('*')).flatMap((element) =>
            Array.from(element.attributes).map((attribute) => attribute.value),
          )
          return [document.title, document.body.innerText, ...attributeValues].join('\n')
        })

        expect(renderedBranding, `${tenant.name} ${route} leaked Medellin branding`).not.toMatch(/medell[ií]n|medellinrewards/i)

        if (route === '/promo/register') {
          const phone = page.locator('#referral-signup-phone')
          if (await phone.count()) {
            const expectedPlaceholder = tenant.slug === 'pinas' || tenant.slug === 'pinasrewards'
              ? '+63 900 000 0000'
              : tenant.slug === 'guatemala'
                ? '+502 5000 0000'
                : '+1 555 000 0000'
            await expect(phone).toHaveAttribute('placeholder', expectedPlaceholder)
            await expect(phone).not.toHaveAttribute('placeholder', /\+57/)
          }
        }
      }

      await page.goto(`/business?tenant=${tenant.slug}`, { waitUntil: 'domcontentloaded' })
      const businessHeader = page.locator('.business-public-shell__header')
      await expect(businessHeader).toHaveCSS('position', 'sticky')
      await page.evaluate(() => window.scrollTo(0, Math.min(700, document.body.scrollHeight)))
      await expect.poll(() => businessHeader.evaluate((element) => Math.round(element.getBoundingClientRect().top))).toBe(0)
    })
  }
})
