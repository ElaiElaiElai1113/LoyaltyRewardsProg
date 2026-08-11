import { expect, test } from '@playwright/test'

test.describe('public acquisition workflow', () => {
  test('RewardMe public links have real destinations and no missing section targets', async ({ page, request }) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('ERR_NETWORK_ACCESS_DENIED')) {
        runtimeErrors.push(message.text())
      }
    })

    for (const route of ['/', '/business', '/membership', '/shop', '/join', '/signin', '/terms', '/privacy']) {
      const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
      expect(response?.ok(), route).toBeTruthy()
      await page.locator('main').waitFor()

      const hrefs = await page.locator('a[href]').evaluateAll((links) => (
        [...new Set(links.map((link) => link.getAttribute('href')?.trim() ?? ''))]
      ))
      expect(hrefs, `${route} empty links`).not.toContain('')
      expect(hrefs.some((href) => href.startsWith('javascript:')), `${route} javascript links`).toBe(false)

      for (const href of hrefs) {
        if (href.startsWith('#')) {
          expect(await page.locator(href).count(), `${route} missing ${href}`).toBeGreaterThan(0)
        } else if (href.startsWith('/')) {
          const target = await request.get(href)
          expect(target.ok(), `${route} -> ${href}`).toBeTruthy()
        } else if (href.startsWith('mailto:')) {
          expect(href, `${route} support email`).toMatch(/^mailto:support@rewardme\.ph(?:\?|$)/)
        }
      }
    }

    expect(runtimeErrors).toEqual([])
  })

  test('search metadata exposes only public launch routes', async ({ request }, testInfo) => {
    const hostname = new URL(String(testInfo.project.use.baseURL)).hostname
    const expectedOrigin = new Map([
      ['www.medellinrewards.com', 'https://www.medellinrewards.com'],
      ['guatemalarewards.com', 'https://guatemalarewards.com'],
      ['rewardme-ph.vercel.app', 'https://rewardme-ph.vercel.app'],
    ]).get(hostname)
    const robots = await request.get('/robots.txt')
    expect(robots.ok()).toBeTruthy()
    const robotsText = await robots.text()
    expect(robotsText).toContain('User-agent: *')

    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.ok()).toBeTruthy()
    const xml = await sitemap.text()
    expect(xml).toContain('<urlset')
    if (expectedOrigin) {
      expect(robotsText).toContain(`Sitemap: ${expectedOrigin}/sitemap.xml`)
      expect(xml).toContain(`<loc>${expectedOrigin}/for-businesses</loc>`)
    } else {
      expect(robotsText).not.toContain('medellinrewards.com')
      expect(robotsText).not.toContain('guatemalarewards.com')
      expect(robotsText).not.toContain('pinas-' + 'rewards.vercel.app')
      expect(xml).not.toContain('<loc>')
    }
    expect(xml).not.toContain('/admin/')
    expect(xml).not.toContain('/business/dashboard')
  })

  test('RewardMe homepage follows the approved pitch and public journey', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('RewardMe')
    await expect(page.getByRole('heading', { name: "Turn what you already spend into what you're saving for." })).toBeVisible()
    await expect(page.getByRole('heading', { name: "Three steps. That's the whole system." })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Most places, 20% or more back. Some days, all of it.' })).toBeVisible()
    await expect(page.getByText('No rewards or referral bonuses are paid during the trial.', { exact: false })).toBeVisible()
    await expect(page.getByText('$25/month', { exact: true })).toBeVisible()
    await expect(page.getByText('$100/year', { exact: true })).toBeVisible()
    await expect(page.getByText('PLANNED · NOT LIVE', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start your free access' })).toHaveAttribute('href', '/join')
    await expect(page.getByRole('link', { name: 'Browse the store' })).toHaveAttribute('href', '/shop')
    await expect(page.getByRole('link', { name: 'See how businesses join' })).toHaveAttribute('href', '/business')
    await expect(page.locator('body')).not.toContainText('Pinas Rewards')
  })

  test('legacy landing URL resolves to the RewardMe homepage', async ({ page }) => {
    await page.goto('/landing-page')
    await expect(page.getByRole('heading', { name: "Turn what you already spend into what you're saving for." })).toBeVisible()
  })

  test('homepage uses the approved editorial typography and clean media', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: "Turn what you already spend into what you're saving for." }))
      .toHaveCSS('font-family', /Georgia/)
    await expect(page.getByText('RewardMe connects everyday spending', { exact: false }))
      .toHaveCSS('font-family', /Inter/)
    await expect(page.getByRole('img', { name: 'A customer checking a mobile rewards account in a local café' }))
      .toHaveAttribute('src', /coffee-member[^"]*\.webp/)
    await expect(page.locator('.rewardme-home__brand').first()).toContainText('RewardMe')
    await expect(page.locator('.rewardme-home__ledger')).toContainText('ILLUSTRATION')
  })

  test('mobile homepage has no horizontal overflow and keeps every CTA reachable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/')

    await expect(page.getByRole('heading', { name: "Turn what you already spend into what you're saving for." })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Start your free access' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'See how it works' })).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  })

  test('membership and signup disclose trial and demo-billing limits', async ({ page }) => {
    await page.goto('/membership')
    await expect(page.getByRole('heading', { name: 'Choose how you want to earn.' })).toBeVisible()
    await expect(page.getByText('Demo billing:', { exact: false })).toBeVisible()
    await expect(page.getByText('No real payment is processed here.', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Regular' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Gold' })).toBeVisible()

    await page.goto('/join')
    await expect(page.getByText('Three-month free access', { exact: true })).toBeVisible()
    await expect(page.getByText('Rewards and referral bonuses begin after you become a paid member.', { exact: false })).toBeVisible()
    await expect(page.locator('#join-email')).toBeVisible()
    await expect(page.locator('form').getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
  })

  test('RewardMe business page presents both approved participation models', async ({ page }) => {
    await page.goto('/business')

    await expect(page.getByRole('heading', { name: 'Turn unused capacity into loyal, paying customers.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Commission model' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Business-credit model' })).toBeVisible()
    await expect(page.getByText('25% commission', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Connected economics. Separate products.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Business sign in' })).toHaveAttribute('href', '/business/login')
    await expect(page.getByRole('link', { name: 'Apply to partner' })).toHaveAttribute('href', /mailto:/)
    await expect(page.getByRole('img', { name: 'Local business owner welcoming RewardMe members' }))
      .toHaveAttribute('src', /local-business-owner(?:-[\w-]+)?\.png/)
  })

  test('business page stays readable without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/business')

    await expect(page.getByRole('heading', { name: 'Turn unused capacity into loyal, paying customers.' })).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  })

  test('early access invitation uses the final RewardMe identity', async ({ page }) => {
    await page.goto('/invitation')
    await expect(page.locator('body')).toContainText('RewardMe')
    await expect(page.locator('body')).not.toContainText('Pinas Rewards')
    await expect(page.locator('body')).toContainText(/Suscribirse|Subscribe/i)
  })
})
