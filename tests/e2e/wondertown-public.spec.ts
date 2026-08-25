import { expect, test, type Page } from '@playwright/test'

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('ERR_NETWORK_ACCESS_DENIED')) {
      errors.push(`console: ${message.text()}`)
    }
  })
  return errors
}

test.describe('Wondertown public testing experience', () => {
  test('homepage exposes the complete public journey on desktop and phone', async ({ page }) => {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/?tenant=wondertown')

      const header = page.getByLabel('Wondertown Rewards navigation')
      await expect(header.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/signin')
      await expect(header.getByRole('link', { name: 'Sign In' })).toBeVisible()
      for (const [name, href] of [
        ['How It Works', '#how'],
        ['For Business', '/business'],
        ['Rewards', '#rewards'],
      ] as const) {
        const link = header.locator(`a[href="${href}"]`)
        await expect(link).toHaveAttribute('href', href)
        await expect(link).toHaveText(name)
      }
      await expect(page.locator('.reference-rewardme__footer').getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/signin')

      const width = await page.evaluate(() => ({
        client: document.documentElement.clientWidth,
        scroll: document.documentElement.scrollWidth,
      }))
      expect(width.scroll).toBeLessThanOrEqual(width.client + 1)
    }
  })

  test('partner map spreads locations across the town on mobile and desktop', async ({ page }) => {
    const runtimeErrors = collectRuntimeErrors(page)

    for (const viewport of [
      { width: 320, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 1000 },
    ]) {
      await page.setViewportSize(viewport)
      const response = await page.goto('/shop?tenant=wondertown', { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBeLessThan(400)

      const map = page.getByTestId('partner-map')
      const pins = page.getByTestId('business-map-pin')
      await expect(map).toBeVisible()
      await expect(page.getByTestId('realistic-map-cartography')).toBeVisible()
      await expect(page.getByTestId('map-scale')).toContainText('250 m')
      await expect(page.getByTestId('map-compass')).toContainText('N')
      await expect(map.getByText('Storybook Lane', { exact: true })).toBeVisible()
      await expect(map.getByText('Starlight Square', { exact: true })).toBeVisible()
      await expect(map.getByText('CIVIC PARK', { exact: true })).toBeVisible()
      await expect(map.getByText('SILVER CREEK', { exact: true })).toBeVisible()
      await expect(map.getByText('Laureles', { exact: true })).toHaveCount(0)

      const emptyState = page.getByTestId('partner-map-empty-state')
      if (await emptyState.isVisible()) {
        await expect(pins).toHaveCount(0)
        expect(runtimeErrors, `${viewport.width}px empty-map runtime errors`).toEqual([])
        continue
      }

      await expect(pins).toHaveCount(5)

      const mapBox = await map.boundingBox()
      const pinBoxes = await pins.evaluateAll((elements) => elements.map((element) => {
        const rect = element.getBoundingClientRect()
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom }
      }))
      expect(mapBox).not.toBeNull()

      for (let firstIndex = 0; firstIndex < pinBoxes.length; firstIndex += 1) {
        const first = pinBoxes[firstIndex]
        expect(first.left).toBeGreaterThanOrEqual((mapBox?.x ?? 0) - 1)
        expect(first.right).toBeLessThanOrEqual((mapBox?.x ?? 0) + (mapBox?.width ?? 0) + 1)
        for (let secondIndex = firstIndex + 1; secondIndex < pinBoxes.length; secondIndex += 1) {
          const second = pinBoxes[secondIndex]
          const overlapWidth = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
          const overlapHeight = Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
          expect(overlapWidth * overlapHeight, `${viewport.width}px pins ${firstIndex} and ${secondIndex} overlap`).toBe(0)
        }
      }

      expect(runtimeErrors, `${viewport.width}px map runtime errors`).toEqual([])
    }
  })

  test('test sign-in only exposes three automatic role choices', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto('/signin?tenant=wondertown')

    for (const role of ['Admin', 'Business', 'Customer']) {
      await expect(page.getByRole('button', { name: `Sign in as ${role}`, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('button')).toHaveCount(3)
    await expect(page.getByRole('link')).toHaveCount(0)
    await expect(page.locator('#signin-email')).toHaveCount(0)
    await expect(page.locator('#signin-password')).toHaveCount(0)
    await expect(page.getByTestId('wondertown-test-credentials')).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText('Rewards 123!')
    await expect(page.locator('body')).not.toContainText('@wondertown.test')

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
  })

  test('public and signed-out routes have no visual or navigation dead ends', async ({ page }) => {
    test.setTimeout(120_000)
    const runtimeErrors = collectRuntimeErrors(page)
    const routes = ['/', '/signin', '/business', '/business/login', '/shop', '/gift-cards', '/terms', '/privacy']

    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 1024 })
      for (const route of routes) {
        runtimeErrors.length = 0
        const response = await page.goto(`${route}?tenant=wondertown`, { waitUntil: 'domcontentloaded' })
        expect(response?.status(), `${route} at ${width}px`).toBeLessThan(400)
        await expect(page.locator('main')).toBeVisible()

        const integrity = await page.evaluate(() => {
          const viewportWidth = document.documentElement.clientWidth
          const visible = (element: Element) => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
          }
          const clippedControls = Array.from(document.querySelectorAll<HTMLElement>(
            'a, button, input, select, textarea, summary, [role="button"], [role="tab"]',
          ))
            .filter(visible)
            .map((element) => {
              const rect = element.getBoundingClientRect()
              return {
                label: (element.textContent ?? element.getAttribute('aria-label') ?? element.tagName)
                  .replace(/\s+/g, ' ')
                  .trim()
                  .slice(0, 80),
                left: Math.round(rect.left),
                right: Math.round(rect.right),
              }
            })
            .filter((element) => element.left < -2 || element.right > viewportWidth + 2)
          const emptyLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('a'))
            .filter(visible)
            .filter((link) => !link.getAttribute('href')?.trim() || link.getAttribute('href') === '#')
            .map((link) => link.textContent?.trim() || link.getAttribute('aria-label') || 'unlabelled link')
          const brokenImages = Array.from(document.images)
            .filter((image) => image.complete && image.naturalWidth === 0)
            .map((image) => image.currentSrc || image.src)
          const text = document.body.innerText.replace(/\s+/g, ' ').trim()

          return {
            brokenImages,
            clippedControls,
            emptyLinks,
            fatalCopy: /application error|page crashed|something went wrong|page not found/i.test(text),
            overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
            textLength: text.length,
          }
        })

        expect(integrity.textLength, `${route} empty page at ${width}px`).toBeGreaterThan(20)
        expect(integrity.overflow, `${route} overflow at ${width}px`).toBeLessThanOrEqual(2)
        expect(integrity.clippedControls, `${route} clipped controls at ${width}px`).toEqual([])
        expect(integrity.emptyLinks, `${route} empty links at ${width}px`).toEqual([])
        expect(integrity.brokenImages, `${route} broken images at ${width}px`).toEqual([])
        expect(integrity.fatalCopy, `${route} fatal copy at ${width}px`).toBe(false)
        expect(runtimeErrors, `${route} runtime errors at ${width}px`).toEqual([])
      }
    }
  })

  test('all public pages remain free of Medellin branding and legacy visual assets', async ({ page }) => {
    test.setTimeout(120_000)
    const runtimeErrors = collectRuntimeErrors(page)
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
      const response = await page.goto(`${route}?tenant=wondertown`, { waitUntil: 'domcontentloaded' })
      expect(response?.status(), route).toBeLessThan(400)

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
})
