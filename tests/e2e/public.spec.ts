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

  test('all RewardMe public pages remain free of Medellin branding and legacy visual assets', async ({ page }) => {
    test.setTimeout(120_000)
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('ERR_NETWORK_ACCESS_DENIED')) {
        runtimeErrors.push(message.text())
      }
    })
    const routes = [
      '/',
      '/landing-page',
      '/guide',
      '/shop',
      '/business',
      '/cost-calculator',
      '/signin',
      '/join',
      '/invitation',
      '/terms',
      '/privacy',
      '/reward-terms',
      '/verification-policy',
      '/promotions',
      '/membership',
      '/ambassadors',
      '/promo',
      '/promo/register',
      '/gift-cards',
    ]

    await page.setViewportSize({ width: 390, height: 844 })

    for (const route of routes) {
      runtimeErrors.length = 0
      const response = await page.goto(`${route}?tenant=rewardme`, { waitUntil: 'networkidle' })
      expect(response?.status(), route).toBeLessThan(400)
      await page.locator('main').waitFor()

      const branding = await page.evaluate(() => {
        const attributeValues = Array.from(document.querySelectorAll<HTMLElement>('*')).flatMap((element) =>
          ['aria-label', 'alt', 'title', 'placeholder', 'href'].map((attribute) => element.getAttribute(attribute) ?? ''),
        )
        const imageSources = Array.from(document.images).map((image) => image.getAttribute('src') ?? '')
        const searchableText = [document.title, document.body.innerText, ...attributeValues].join('\n')

        return {
          hasMedellinBrand: /medell[ií]n|medellinrewards/i.test(searchableText),
          legacyGuideImages: imageSources.filter((source) =>
            /^\/walkthrough-screenshots\/(?:guide|public-map|business-page|business-login|admin-login)\.png$/i.test(source),
          ),
        }
      })

      expect(branding.hasMedellinBrand, `${route} leaked Medellin branding`).toBe(false)
      expect(branding.legacyGuideImages, `${route} used Medellin guide screenshots`).toEqual([])
      expect(runtimeErrors, `${route} runtime errors`).toEqual([])
    }
  })

  test('search metadata exposes only public launch routes', async ({ request }, testInfo) => {
    const hostname = new URL(String(testInfo.project.use.baseURL)).hostname
    const expectedOrigin = new Map([
      ['www.medellinrewards.com', 'https://www.medellinrewards.com'],
      ['guatemalarewards.com', 'https://guatemalarewards.com'],
      ['loyalty-rewards-prog.vercel.app', 'https://loyalty-rewards-prog.vercel.app'],
      ['rewardme-prod.vercel.app', 'https://loyalty-rewards-prog.vercel.app'],
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
      .toHaveAttribute('src', /coffee-member-wide(?:-[\w-]+)?\.webp/)
    const homeImageFraming = await page.getByRole('img', { name: 'A customer checking a mobile rewards account in a local café' }).evaluate((image: HTMLImageElement) => ({
      naturalRatio: image.naturalWidth / image.naturalHeight,
      renderedRatio: image.clientWidth / image.clientHeight,
    }))
    expect(Math.abs(homeImageFraming.naturalRatio - homeImageFraming.renderedRatio)).toBeLessThan(0.02)
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

  test('RewardMe partner map stays useful and truthful before public partners are published', async ({ page }) => {
    const runtimeErrors: string[] = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))

    for (const viewport of [
      { width: 320, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/shop', { waitUntil: 'domcontentloaded' })

      await expect(page.getByTestId('partner-map')).toBeVisible()
      await expect(page.getByTestId('realistic-map-cartography')).toBeVisible()
      await expect(page.getByTestId('map-scale')).toContainText('250 m')
      await expect(page.getByTestId('map-compass')).toContainText('N')
      await expect(page.getByTestId('partner-map-empty-state')).toBeVisible()
      await expect(page.getByTestId('partner-count')).toHaveText('0')
      await expect(page.getByTestId('map-count')).toHaveText('0')
      await expect(page.getByTestId('product-count')).toHaveText('0')
      const mapEmptyState = page.getByTestId('partner-map-empty-state')
      await expect(mapEmptyState.getByRole('link', { name: 'For Businesses' })).toHaveAttribute('href', '/business')
      await expect(mapEmptyState.getByRole('link', { name: 'Sign in' }))
        .toHaveAttribute('href', '/signin')

      const integrity = await page.evaluate(() => ({
        emptyLinks: Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
          .filter((link) => !link.getAttribute('href')?.trim() || link.getAttribute('href') === '#')
          .map((link) => link.textContent?.trim() || link.getAttribute('aria-label') || 'unlabelled link'),
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      }))
      expect(integrity.emptyLinks).toEqual([])
      expect(integrity.overflow).toBeLessThanOrEqual(2)
      expect(runtimeErrors, `${viewport.width}px runtime errors`).toEqual([])
    }
  })

  test('membership and signup disclose trial and manual-enrollment limits', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/membership')
    await expect(page.getByRole('heading', { name: 'Choose how you want to earn.' })).toBeVisible()
    await expect(page.getByText('Manual enrollment:', { exact: false })).toBeVisible()
    await expect(page.getByText('RewardMe does not collect online payments or card details.', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Regular' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Gold' })).toBeVisible()
    await page.getByRole('link', { name: 'Request Regular or Gold access' }).click()
    await expect(page).toHaveURL(/\/invitation\?interest=membership$/)
    await expect(page.getByRole('heading', { name: 'Request Regular or Gold access' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send membership request' })).toBeVisible()
    const mobileDimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(mobileDimensions.scrollWidth).toBeLessThanOrEqual(mobileDimensions.clientWidth)

    await page.goto('/join')
    await expect(page.getByText('Three-month free access', { exact: true })).toBeVisible()
    await expect(page.getByText('the RewardMe team activates an eligible Regular or Gold membership.', { exact: false })).toBeVisible()
    await expect(page.locator('#join-email')).toBeVisible()
    await expect(page.locator('form').getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
  })

  test('RewardMe uses one role-safe sign-in page with complete one-tap test accounts', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/signin')

    for (const role of ['Admin', 'Business', 'Customer']) {
      await expect(page.getByRole('button', { name: `Sign in as ${role}`, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Sign in as Customer', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Sign in as Business', exact: true }).click()
    await expect(page).toHaveURL(/\/signin\?portal=business/)
    await expect(page.getByRole('button', { name: 'Sign in as Business', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: 'Sign in as Admin', exact: true }).click()
    await expect(page).toHaveURL(/\/signin\?portal=admin/)

    const credentials = page.getByTestId('rewardme-test-credentials')
    await expect(credentials).toBeVisible()
    await expect(credentials.getByText('Rewards 123!', { exact: true })).toBeVisible()
    for (const [email, accountLabel] of [
      ['member@rewardme.test', 'Member'],
      ['owner@rewardme.test', 'Business owner'],
      ['staff@rewardme.test', 'Business staff'],
      ['admin@rewardsplatform.test', 'Platform admin'],
    ] as const) {
      const account = credentials.locator('article').filter({ hasText: email })
      await expect(account.getByText(email, { exact: true })).toBeVisible()
      await expect(account.getByRole('button', { name: `Sign in as ${accountLabel}` })).toBeVisible()
    }

    await expect(page.locator('body')).not.toContainText(/medellin/i)
    await expect(page.locator('body')).not.toContainText('MedellinQA!2026')

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)

    await page.goto('/business/login?redirect=%2Fbusiness%2Fdashboard')
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fbusiness%2Fdashboard&portal=business/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/signin\?portal=admin/)
  })

  test('RewardMe business page presents both approved participation models', async ({ page }) => {
    await page.goto('/business')

    await expect(page.getByRole('heading', { name: 'Turn unused capacity into loyal, paying customers.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Commission model' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Business-credit model' })).toBeVisible()
    await expect(page.getByText('25% commission', { exact: false })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Connected economics. Separate products.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Business sign in' })).toHaveAttribute('href', '/signin?portal=business')
    await expect(page.getByRole('link', { name: 'Apply to partner' })).toHaveAttribute('href', /mailto:/)
    await expect(page.getByRole('img', { name: 'Local business owner welcoming RewardMe members' }))
      .toHaveAttribute('src', /local-business-owner-wide(?:-[\w-]+)?\.webp/)
    const businessImageFraming = await page.getByRole('img', { name: 'Local business owner welcoming RewardMe members' }).evaluate((image: HTMLImageElement) => ({
      naturalRatio: image.naturalWidth / image.naturalHeight,
      renderedRatio: image.clientWidth / image.clientHeight,
    }))
    expect(Math.abs(businessImageFraming.naturalRatio - businessImageFraming.renderedRatio)).toBeLessThan(0.02)
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
