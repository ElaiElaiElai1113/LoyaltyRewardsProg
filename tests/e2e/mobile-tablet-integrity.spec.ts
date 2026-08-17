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
  '/shop',
  '/gift-cards',
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
              .map((element) => ({
                control: element.id || element.getAttribute('name') || element.tagName,
                className: element.className,
                fontSize: getComputedStyle(element).fontSize,
                label: element.getAttribute('aria-label') || element.getAttribute('placeholder') || '',
              }))
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

  test('business transaction controls shrink and wrap at scrollbar-reduced phone widths', async ({ page }) => {
    for (const width of [305, 320]) {
      await page.setViewportSize({ width, height: 844 })
      await page.goto('/')
      await page.setContent(`
        <link rel="stylesheet" href="/src/index.css" />
        <main class="min-w-0 px-4">
          <section class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
            <article class="min-w-0 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)]">
              <header class="p-4 sm:p-6">
                <h1 class="break-words font-serif text-4xl sm:text-5xl">Mga Transaksiyon</h1>
              </header>
              <div class="min-w-0 space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
                <div class="min-w-0 [&_button]:h-auto [&_button]:min-h-10 [&_button]:min-w-0 [&_button]:whitespace-normal [&_button]:py-2 [&_button]:text-center [&_button]:leading-snug">
                  <div class="grid gap-3 sm:grid-cols-2">
                    <button class="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold">Mag-scan gamit ang Kamera</button>
                    <button class="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold">Pumili ng Larawan ng Screen</button>
                  </div>
                </div>
                <div class="flex min-w-0 flex-col gap-3 sm:flex-row">
                  <input aria-label="Member QR link or token" class="flex h-12 min-w-0 w-full rounded-2xl border px-4 py-3 text-base" />
                  <button class="inline-flex h-auto min-h-10 w-full items-center justify-center whitespace-normal rounded-full px-4 py-2 text-center text-sm font-semibold leading-snug sm:w-auto sm:shrink-0">Ikarga ang Kostumer</button>
                </div>
                <div class="flex min-w-0 flex-col gap-3 sm:flex-row">
                  <input aria-label="Gift card code" class="flex h-12 min-w-0 w-full rounded-2xl border px-4 py-3 text-base" />
                  <button class="inline-flex h-auto min-h-10 w-full items-center justify-center whitespace-normal rounded-full px-4 py-2 text-center text-sm font-semibold leading-snug sm:w-auto sm:shrink-0">Suriin ang Kard na Regalo</button>
                </div>
              </div>
            </article>
            <article class="min-w-0 overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--card)]">
              <div class="min-w-0 p-4 sm:p-6">
                <button class="inline-flex h-auto min-h-12 w-full items-center justify-center whitespace-normal rounded-full px-4 py-3 text-center text-sm font-semibold leading-snug">Gamitin ang Kard na Regalo at Tapusin ang Benta</button>
              </div>
            </article>
          </section>
        </main>
      `)
      await page.waitForLoadState('networkidle')

      const layout = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth
        const clippedControls = Array.from(document.querySelectorAll<HTMLElement>('button, input'))
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return {
              label: element.getAttribute('aria-label') ?? element.textContent?.trim() ?? '',
              left: Math.round(rect.left),
              right: Math.round(rect.right),
            }
          })
          .filter((element) => element.left < -1 || element.right > viewportWidth + 1)

        return {
          clippedControls,
          overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
        }
      })

      expect(layout.overflow, `${width}px transaction harness overflow`).toBeLessThanOrEqual(1)
      expect(layout.clippedControls, `${width}px transaction harness clipped controls`).toEqual([])
    }
  })
})
