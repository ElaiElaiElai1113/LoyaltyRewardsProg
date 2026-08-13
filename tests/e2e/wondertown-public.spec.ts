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
  test('member, business, and admin sign-in portals publish complete working credentials', async ({ page }) => {
    const portals = [
      {
        route: '/signin?tenant=wondertown',
        email: 'member@wondertown.test',
        emailInput: '#signin-email',
        passwordInput: '#signin-password',
        visibleEmails: [
          'member@wondertown.test',
          'neighbor@wondertown.test',
          'owner@wondertown.test',
          'staff@wondertown.test',
          'admin@rewardsplatform.test',
        ],
      },
      {
        route: '/business/login?tenant=wondertown',
        email: 'owner@wondertown.test',
        emailInput: '#staff-signin-email',
        passwordInput: '#staff-signin-password',
        visibleEmails: [
          'member@wondertown.test',
          'neighbor@wondertown.test',
          'owner@wondertown.test',
          'staff@wondertown.test',
          'admin@rewardsplatform.test',
        ],
      },
      {
        route: '/admin?tenant=wondertown',
        email: 'admin@rewardsplatform.test',
        emailInput: '#staff-signin-email',
        passwordInput: '#staff-signin-password',
        visibleEmails: ['admin@rewardsplatform.test'],
      },
    ] as const

    for (const portal of portals) {
      await page.setViewportSize({ width: 320, height: 844 })
      await page.goto(portal.route)

      const credentials = page.getByTestId('wondertown-test-credentials')
      await expect(credentials).toBeVisible()
      await expect(credentials.getByText('Rewards 123!', { exact: true })).toBeVisible()
      for (const email of portal.visibleEmails) {
        await expect(credentials.getByText(email, { exact: true })).toBeVisible()
      }

      await credentials
        .locator('article')
        .filter({ hasText: portal.email })
        .getByRole('button', { name: 'Use account' })
        .click()
      await expect(page.locator(portal.emailInput)).toHaveValue(portal.email)
      await expect(page.locator(portal.passwordInput)).toHaveValue('Rewards 123!')

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1)
    }
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
})
