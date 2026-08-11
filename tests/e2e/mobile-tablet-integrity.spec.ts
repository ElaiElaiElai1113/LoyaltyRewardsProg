import { expect, test } from '@playwright/test'

const devices = [
  { name: 'compact phone portrait', width: 320, height: 568 },
  { name: 'phone portrait', width: 390, height: 844 },
  { name: 'phone landscape', width: 844, height: 390 },
  { name: 'tablet portrait', width: 768, height: 1024 },
  { name: 'large tablet portrait', width: 820, height: 1180 },
  { name: 'tablet landscape', width: 1024, height: 768 },
] as const

const routes = [
  '/',
  '/signin',
  '/business',
  '/business/login',
  '/admin',
  '/reset-password',
  '/accept-invitation',
  '/terms',
  '/privacy',
  '/reward-terms',
  '/verification-policy',
] as const

test.describe('RewardMe mobile and tablet integrity', () => {
  test.describe.configure({ timeout: 120_000 })

  for (const device of devices) {
    test(`${device.name} has no visual dead ends`, async ({ browser, baseURL }) => {
      const context = await browser.newContext({
        viewport: { width: device.width, height: device.height },
        hasTouch: true,
        deviceScaleFactor: 1,
      })
      const page = await context.newPage()
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))

      try {
        for (const route of routes) {
          pageErrors.length = 0
          const response = await page.goto(`${baseURL}${route}`, { waitUntil: 'domcontentloaded' })
          expect(response?.status(), `${route} at ${device.width}x${device.height}`).toBeLessThan(400)
          await expect(page.locator('main')).toBeVisible()

          const integrity = await page.evaluate(() => {
            const viewportWidth = document.documentElement.clientWidth
            const visible = (element: Element) => {
              const rect = element.getBoundingClientRect()
              const style = getComputedStyle(element)
              return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
            }
            const clippedInteractive = [...document.querySelectorAll<HTMLElement>(
              'a, button, input, select, textarea, summary, [role="button"]',
            )]
              .filter(visible)
              .map((element) => {
                const rect = element.getBoundingClientRect()
                return {
                  label: (element.textContent || element.getAttribute('aria-label') || element.getAttribute('placeholder') || element.tagName)
                    .replace(/\s+/g, ' ')
                    .trim()
                    .slice(0, 80),
                  left: Math.round(rect.left),
                  right: Math.round(rect.right),
                }
              })
              .filter((element) => element.left < -2 || element.right > viewportWidth + 2)
            const emptyLinks = [...document.querySelectorAll<HTMLAnchorElement>('a')]
              .filter(visible)
              .filter((link) => {
                const href = link.getAttribute('href')?.trim()
                return !href || href === '#'
              })
              .map((link) => link.textContent?.trim() || link.getAttribute('aria-label') || 'unlabelled link')
            const brokenImages = [...document.images]
              .filter((image) => image.complete && image.naturalWidth === 0)
              .map((image) => image.currentSrc || image.src)
            const undersizedInputText = [...document.querySelectorAll<HTMLElement>('input, select, textarea')]
              .filter(visible)
              .filter((element) => Number.parseFloat(getComputedStyle(element).fontSize) < 16)
              .map((element) => element.id || element.getAttribute('name') || element.tagName)
            const bodyText = document.body.innerText.replace(/\s+/g, ' ').trim()

            return {
              bodyTextLength: bodyText.length,
              brokenImages,
              clippedInteractive,
              emptyLinks,
              hasFatalError: /application error|page crashed|something went wrong/i.test(bodyText),
              hasLegacyRewardMeBrand: /\b(?:Medellin Rewards|PinasRewards|Pinas Rewards)\b/i.test(bodyText),
              overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
              undersizedInputText,
            }
          })

          expect(integrity.bodyTextLength, `${route} body text`).toBeGreaterThan(20)
          expect(integrity.overflow, `${route} horizontal overflow`).toBeLessThanOrEqual(2)
          expect(integrity.clippedInteractive, `${route} clipped controls`).toEqual([])
          expect(integrity.emptyLinks, `${route} empty links`).toEqual([])
          expect(integrity.brokenImages, `${route} broken images`).toEqual([])
          expect(integrity.undersizedInputText, `${route} iOS auto-zoom risk`).toEqual([])
          expect(integrity.hasFatalError, `${route} fatal UI copy`).toBe(false)
          expect(integrity.hasLegacyRewardMeBrand, `${route} legacy RewardMe branding`).toBe(false)
          expect(pageErrors, `${route} runtime errors`).toEqual([])
        }
      } finally {
        await context.close()
      }
    })
  }
})
