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
      ['loyalty-rewards-prog.vercel.app', 'https://rewardme-prod.vercel.app'],
      ['rewardme-prod.vercel.app', 'https://rewardme-prod.vercel.app'],
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
    await expect(page.getByRole('heading', { name: 'Earn amazing rewards while supporting local businesses.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: "Three steps. That's the whole system." })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Most places, 20% or more back. Some days, all of it.' })).toBeVisible()
    await expect(page.locator('.reference-rewardme__fine')).toContainText('no card required until you decide to stay')
    await expect(page.locator('.reference-rewardme__balance')).toContainText('Available to redeem')
    await expect(page.locator('.reference-rewardme__passbook-title')).toContainText('NO. 00482')
    await expect(page.locator('.reference-rewardme__entry').nth(0)).toContainText('Coffee run, The Daily Grind — $5 spent, 20% back')
    await expect(page.locator('.reference-rewardme__entry').nth(0)).toContainText('+ $1')
    await expect(page.locator('.reference-rewardme__entry').nth(1)).toContainText('Dinner out, Harvest & Vine — $60 spent, 100% back')
    await expect(page.locator('.reference-rewardme__entry').nth(1)).toContainText('+ $60')
    await expect(page.locator('.reference-rewardme__entry').nth(2)).toContainText('Weekend stay, The Wayfarer Inn — $240 spent, 20% back')
    await expect(page.locator('.reference-rewardme__entry').nth(2)).toContainText('+ $48')
    await expect(page.locator('.reference-rewardme__balance')).toContainText('$109')
    await expect(page.getByRole('link', { name: 'Start free trial' }).first()).toHaveAttribute('href', '/join')
    await expect(page.getByRole('link', { name: 'See how it works' })).toHaveAttribute('href', '#how')
    const header = page.getByLabel('RewardMe navigation')
    await expect(header.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how')
    await expect(header.getByRole('link', { name: 'For businesses' })).toHaveAttribute('href', '#business')
    await expect(header.getByRole('link', { name: 'The store' })).toHaveAttribute('href', '#store')
    await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
    await expect(page.locator('body')).not.toContainText('Pinas Rewards')
  })

  test('legacy landing URL resolves to the RewardMe homepage', async ({ page }) => {
    await page.goto('/landing-page')
    await expect(page.getByRole('heading', { name: 'Earn amazing rewards while supporting local businesses.' })).toBeVisible()
  })

  test('homepage uses the approved editorial typography and clean media', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Earn amazing rewards while supporting local businesses.' }))
      .toHaveCSS('font-family', /Fraunces/)
    await expect(page.getByText('Earn high rewards when you spend', { exact: false }))
      .toHaveCSS('font-family', /IBM Plex Sans/)
    await expect(page.locator('.reference-rewardme img')).toHaveCount(5)
    await expect(page.locator('.reference-rewardme__passbook')).toBeVisible()
    await expect(page.locator('.reference-rewardme__logo').first()).toContainText('RewardMe')
    await expect(page.locator('.reference-rewardme__balance')).toContainText('109')

    const editorialPhotos = page.locator([
      '.reference-rewardme__wide-photo img',
      '.reference-rewardme__photo-grid img',
      '.reference-rewardme__business-card img',
    ].join(','))
    await expect(editorialPhotos).toHaveCount(5)
    for (let index = 0; index < 5; index += 1) {
      const photo = editorialPhotos.nth(index)
      await photo.scrollIntoViewIfNeeded()
      await expect(photo).toHaveCSS('object-fit', 'contain')
      await expect.poll(() => photo.evaluate((image: HTMLImageElement) =>
        image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
      )).toBe(true)
    }
  })

  test('mobile homepage has no horizontal overflow and keeps every CTA reachable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Earn amazing rewards while supporting local businesses.' })).toBeVisible()
    const menuToggle = page.locator('.reference-rewardme__menu-toggle')
    await expect(menuToggle).toBeVisible()
    await menuToggle.click()
    const mobileNavigation = page.locator('#rewardme-mobile-navigation')
    await expect(mobileNavigation.getByRole('link', { name: 'Start free trial' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'See how it works' })).toBeVisible()
    await expect(mobileNavigation.getByRole('link', { name: 'For businesses' })).toHaveAttribute('href', '#business')
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
    await expect(page.getByRole('heading', { name: 'Join RewardMe.' })).toBeVisible()
    await expect(page.getByText('No cost, ever. Earn 10% back in rewards at participating businesses.')).toBeVisible()
    await expect(page.getByText('authorize billing for the plan selected above', { exact: false })).toBeVisible()
    await expect(page.locator('#join-email')).toBeVisible()
    await expect(page.locator('#join-password')).toHaveAttribute(
      'placeholder',
      'Use at least 12 characters for your new password.',
    )
    await expect(page.locator('.rewardme-join__header a[href="/signin"]')).toHaveAttribute('href', '/signin')
  })

  test('RewardMe sign-in keeps release mode credential-safe', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/signin?tenant=rewardme')
    const shell = page.locator('[data-rewardme-auth-shell]')
    const story = shell.locator('.rewardme-auth-shell__story')
    const card = shell.locator('.product-auth-shell__card')
    await expect(shell).toBeVisible()
    await expect(shell.locator('.rewardme-auth-shell__brand')).toContainText('RewardMe')
    await expect(story.getByRole('heading', { name: 'One account. Clear offers. Local rewards.' })).toBeVisible()
    await expect(shell).toHaveCSS('background-color', 'rgb(246, 241, 228)')
    await expect(story).toHaveCSS('background-color', 'rgb(31, 58, 46)')
    await expect(card).toHaveCSS('background-color', 'rgb(255, 253, 247)')
    await expect(page.locator('#signin-email')).toBeVisible()
    await expect(page.locator('#signin-password')).toBeVisible()
    await expect(page.locator('[data-testid^="quick-sign-in-"]')).toHaveCount(0)
    await expect(page.getByRole('form', { name: 'Sign in' })).toBeVisible()
    await expect(page.locator('[data-testid^="sign-in-portal-"]')).toHaveCount(0)
    await expect(page.getByTestId('rewardme-test-credentials')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('Rewards 123!')
    await expect(page.locator('body')).not.toContainText('@rewardme.test')

    await expect(page.locator('body')).not.toContainText(/medellin/i)
    await expect(page.locator('body')).not.toContainText('MedellinQA!2026')
    await expect(page.getByRole('button', { name: /^Sign in/ })).toHaveCSS('background-color', 'rgb(31, 58, 46)')

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)

    await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(shell).toHaveCSS('background-color', 'rgb(20, 39, 31)')

    await page.goto('/business/login?redirect=%2Fbusiness%2Fdashboard')
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fbusiness%2Fdashboard&portal=business/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/signin\?portal=admin/)
  })

  for (const tenant of [
    { name: 'RewardMe', query: '' },
    { name: 'Wondertown', query: '?tenant=wondertown' },
  ]) {
    test(`${tenant.name} business page presents both approved participation models`, async ({ page }) => {
      await page.goto(`/business${tenant.query}`)

      await expect(page.getByRole('heading', { name: 'Get new customers while rewarding our members.' })).toBeVisible()
      await expect(page.getByText('Commission Model', { exact: true })).toBeVisible()
      await expect(page.getByText('Credit Model', { exact: true })).toBeVisible()
      await expect(page.getByText('No surprise fees, nothing hidden in fine print.', { exact: false })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'You can pay with Synergize credit instead of cash.' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Apply: Commission model' })).toHaveAttribute('href', '/business/apply/commission')
      await expect(page.getByRole('link', { name: 'Apply: Credit model' })).toHaveAttribute('href', '/business/apply/credit')
      await expect(page.getByRole('img', { name: 'Local business owner welcoming rewards members' }))
        .toHaveAttribute('src', /local-business-owner-wide(?:-[\w-]+)?\.webp/)
      await expect(page.getByRole('img', { name: 'Local business owner welcoming rewards members' })).toBeVisible()
      await expect(page.getByRole('img', { name: 'Local business owner welcoming rewards members' })).toHaveCSS('object-fit', 'contain')
      await expect(page.getByRole('img', { name: 'Staff member scanning a member QR code at checkout' })).toHaveCSS('object-fit', 'contain')
      expect(await page.getByRole('img', { name: 'Local business owner welcoming rewards members' }).evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    })
  }

  for (const application of [
    { model: 'commission', heading: 'Commission Model', reference: 'WT-COMMISSION-001' },
    { model: 'credit', heading: 'Credit Model', reference: 'WT-CREDIT-001' },
  ] as const) {
    test(`Wondertown ${application.model} application is a functional sandbox flow`, async ({ page }) => {
      const wondertownOrigin = process.env.E2E_WONDERTOWN_URL?.replace(/\/+$/, '')
      const applicationUrl = wondertownOrigin
        ? `${wondertownOrigin}/business/apply/${application.model}`
        : `/business/apply/${application.model}?tenant=wondertown`
      const submissions: Array<Record<string, unknown>> = []
      await page.route('**/api/business-applications', async (route) => {
        submissions.push(route.request().postDataJSON() as Record<string, unknown>)
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ reference: application.reference }),
        })
      })

      const response = await page.goto(applicationUrl)
      expect(response?.ok()).toBeTruthy()
      await expect(page).toHaveURL(new RegExp(`/business/apply/${application.model}`))
      await expect(page.locator(`main[data-business-application="${application.model}"]`)).toBeVisible()
      await expect(page.getByRole('heading', { name: `Join Wondertown Rewards — ${application.heading}.` })).toBeVisible()
      await expect(page.getByText('Wondertown is a fictional RewardMe test environment.', { exact: false })).toBeVisible()

      const requiredNames = await page.locator('form [required]').evaluateAll((elements) =>
        elements.map((element) => element.getAttribute('name')),
      )
      expect(requiredNames).toEqual([
        'legalName',
        'industry',
        'street',
        'city',
        'region',
        'postal',
        'country',
        'representativeName',
        'representativeTitle',
        'representativeEmail',
        'representativePhone',
        'rewardRate',
        'redemptionAccess',
        'contactConsent',
      ])

      const creditMethod = page.locator('input[name="creditMethod"]')
      await expect(creditMethod).toHaveCount(application.model === 'credit' ? 1 : 0)
      if (application.model === 'credit') {
        await expect(creditMethod).toHaveAttribute('placeholder', /in-store account credit/i)
      }

      await page.getByRole('button', { name: 'Submit Application' }).click()
      await expect(page.locator('input[name="legalName"]')).toBeFocused()
      expect(submissions).toHaveLength(0)

      const values = {
        legalName: 'Wondertown Test Cafe LLC',
        industry: 'Cafe',
        street: '1 Fictional Market Street',
        city: 'Wondertown',
        region: 'Test State',
        postal: '00001',
        country: 'United States',
        representativeName: 'Casey Tester',
        representativeTitle: 'Test Owner',
        representativeEmail: 'casey@example.test',
        representativePhone: '+1 555 010 0200',
      }
      for (const [name, value] of Object.entries(values)) {
        await page.locator(`input[name="${name}"]`).fill(value)
      }
      await page.locator('select[name="rewardRate"]').selectOption({ label: '20% back (minimum)' })
      await page.locator('input[name="contactConsent"]').check()
      if (application.model === 'credit') await creditMethod.fill('Fictional in-store account credit')

      await page.getByRole('button', { name: 'Submit Application' }).click()
      await expect(page.getByRole('heading', { name: "You're in — application received." })).toBeVisible()
      await expect(page.getByText(`Reference number: ${application.reference}`)).toBeVisible()
      expect(submissions).toHaveLength(1)
      expect(submissions[0]).toMatchObject({
        model: application.model,
        legalName: values.legalName,
        representativeEmail: values.representativeEmail,
        creditMethod: application.model === 'credit' ? 'Fictional in-store account credit' : '',
        contactConsent: true,
      })
    })
  }

  test('business page stays readable without horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto('/business')

    await expect(page.getByRole('heading', { name: 'Get new customers while rewarding our members.' })).toBeVisible()
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
    await expect(page.getByRole('button', { name: 'Send information request' })).toBeVisible()
  })
})
