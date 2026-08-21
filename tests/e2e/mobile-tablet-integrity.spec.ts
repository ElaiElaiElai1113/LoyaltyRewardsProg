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

  test('member lists and gift-card selectors stay contained from phone to desktop', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto('/guide?tenant=wondertown')

    await page.evaluate(() => {
      const host = document.createElement('main')
      host.id = 'responsive-portal-test-root'
      host.className = 'min-h-screen bg-background text-foreground'
      host.innerHTML = `
        <section class="mx-auto min-w-0 max-w-6xl space-y-6 px-4 py-6" data-testid="responsive-portal-harness">
          <article class="min-w-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 sm:p-6">
            <h2 class="break-words font-serif text-3xl">Give a customer a gift card</h2>
            <div class="mt-5 grid min-w-0 gap-4 md:grid-cols-2" data-testid="issue-selectors">
              <div class="grid min-w-0 gap-2">
                <span class="text-sm font-bold">Gift card</span>
                <button
                  aria-controls="responsive-catalog-options"
                  aria-expanded="false"
                  aria-label="Gift card"
                  class="flex h-12 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm"
                  role="combobox"
                  type="button"
                >
                  <span class="min-w-0 flex-1 truncate text-left">Choose gift card</span>
                  <span aria-hidden="true" class="shrink-0">⌄</span>
                </button>
              </div>
              <div class="grid min-w-0 gap-2">
                <span class="text-sm font-bold">Customer</span>
                <button
                  aria-label="Customer"
                  class="flex h-12 w-full min-w-0 items-center justify-between gap-2 overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm"
                  role="combobox"
                  type="button"
                >
                  <span class="min-w-0 flex-1 truncate text-left">Choose customer</span>
                  <span aria-hidden="true" class="shrink-0">⌄</span>
                </button>
              </div>
            </div>
            <div class="relative mt-2 min-w-0">
              <div
                class="absolute left-0 top-0 z-50 max-h-72 w-full max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md md:w-[calc(50%-0.5rem)]"
                data-testid="responsive-catalog-options"
                hidden
                id="responsive-catalog-options"
                role="listbox"
              >
                <div class="flex w-full min-w-0 items-center overflow-hidden rounded-sm px-2 py-2 text-sm" role="option">
                  <span class="block min-w-0 flex-1 truncate">A deliberately long catalog item name that must never widen a phone viewport - USD 100.00</span>
                </div>
              </div>
            </div>
            <div class="mt-5 flex justify-end">
              <button class="h-12 w-full rounded-full border px-6 text-sm font-semibold sm:w-auto" data-testid="issue-card-action" type="button">
                Issue Card
              </button>
            </div>
          </article>

          <div aria-label="Responsive members" class="min-w-0 overflow-hidden rounded-xl border bg-card" role="list">
            <div class="flex min-w-0 flex-col gap-3 overflow-hidden p-4 lg:flex-row lg:items-center lg:justify-between" role="listitem">
              <div class="flex min-w-0 items-start gap-3 lg:items-center">
                <div class="size-10 shrink-0 rounded-xl bg-primary"></div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-serif text-lg">E2E Agreement Pending Customer</p>
                  <p class="truncate text-sm">agreement-pending-customer-with-long-address@wondertown.test</p>
                  <p class="block min-w-0 max-w-full truncate text-xs">ID: 60C1574B-E484-470C-A7C1-91B1E81BC21E</p>
                </div>
              </div>
              <div class="flex w-full min-w-0 flex-wrap items-center gap-2 pl-0 sm:pl-[3.25rem] lg:w-auto lg:justify-end lg:pl-0">
                <span class="max-w-full rounded-full border px-2.5 py-1 text-xs font-bold">CUSTOMER</span>
                <span class="max-w-full rounded-full border px-2.5 py-1 text-xs font-bold">ID MISSING</span>
                <span class="max-w-full rounded-full border px-2.5 py-1 text-xs font-bold">UNDER REVIEW</span>
                <span class="max-w-full rounded-full border px-2.5 py-1 text-xs font-bold">0 POINTS</span>
                <span class="max-w-full rounded-full border px-2.5 py-1 text-xs font-bold">0 REWARD CREDITS</span>
                <button class="rounded-full border px-3 py-2 text-sm" type="button">View Profile</button>
                <button class="rounded-full border px-3 py-2 text-sm" type="button">Remove</button>
              </div>
            </div>
          </div>
        </section>
      `

      const trigger = host.querySelector<HTMLButtonElement>('[aria-label="Gift card"]')
      const options = host.querySelector<HTMLElement>('[data-testid="responsive-catalog-options"]')
      const setOpen = (open: boolean) => {
        if (!trigger || !options) return
        trigger.setAttribute('aria-expanded', String(open))
        options.hidden = !open
      }
      trigger?.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'))
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') setOpen(false)
      }, { once: false })

      document.body.replaceChildren(host)
    })

    const harness = page.getByTestId('responsive-portal-harness')
    await expect(harness).toBeVisible()

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 })
      const giftCardTrigger = harness.getByRole('combobox', { name: 'Gift card' })
      const customerTrigger = harness.getByRole('combobox', { name: 'Customer' })
      const issueButton = harness.getByTestId('issue-card-action')
      const selectorBoxes = await Promise.all([giftCardTrigger.boundingBox(), customerTrigger.boundingBox()])
      const issueBox = await issueButton.boundingBox()

      expect(selectorBoxes[0]).not.toBeNull()
      expect(selectorBoxes[1]).not.toBeNull()
      expect(issueBox).not.toBeNull()
      expect(issueBox!.y).toBeGreaterThan(selectorBoxes[1]!.y + selectorBoxes[1]!.height - 1)
      if (width >= 768) {
        expect(Math.abs(selectorBoxes[0]!.y - selectorBoxes[1]!.y)).toBeLessThanOrEqual(1)
      } else {
        expect(selectorBoxes[1]!.y).toBeGreaterThan(selectorBoxes[0]!.y)
      }

      await giftCardTrigger.click()
      const option = page.getByRole('option', { name: /deliberately long catalog item/i })
      await expect(option).toBeVisible()
      const optionBox = await option.boundingBox()
      expect(optionBox).not.toBeNull()
      expect(optionBox!.x).toBeGreaterThanOrEqual(-1)
      expect(optionBox!.x + optionBox!.width).toBeLessThanOrEqual(width + 1)
      await page.keyboard.press('Escape')
      await expect(option).toBeHidden()

      const integrity = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth
        const clipped = Array.from(document.querySelectorAll<HTMLElement>(
          '[data-testid="responsive-portal-harness"] button, [data-testid="responsive-portal-harness"] [role="combobox"]',
        ))
          .map((element) => element.getBoundingClientRect())
          .filter((rect) => rect.left < -1 || rect.right > viewportWidth + 1)
          .length

        return {
          clipped,
          overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
        }
      })

      expect(integrity.overflow, `${width}px member/select harness overflow`).toBeLessThanOrEqual(1)
      expect(integrity.clipped, `${width}px clipped member/select controls`).toBe(0)
    }
  })
})
