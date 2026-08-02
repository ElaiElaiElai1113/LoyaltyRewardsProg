import { expect, test } from '@playwright/test'

const tenantSlugs = ['pinas', 'medellin', 'guatemala'] as const
const viewportWidths = [320, 390, 768, 859, 1024, 1280] as const
const publicRoutes = ['/', '/business'] as const

test.describe('cross-tenant public responsive layouts', () => {
  test.describe.configure({ timeout: 120_000 })

  for (const tenant of tenantSlugs) {
    test(`${tenant} keeps public content inside every supported viewport`, async ({ page }) => {
      for (const width of viewportWidths) {
        await page.setViewportSize({ width, height: 844 })

        for (const route of publicRoutes) {
          await page.goto(`${route}?tenant=${tenant}`, { waitUntil: 'domcontentloaded' })
          await page.locator('main').waitFor()

          const layout = await page.evaluate(() => {
            const viewportWidth = document.documentElement.clientWidth
            const criticalSelector = [
              '.figma-home__header-inner',
              '.figma-home__hero-copy',
              '.figma-home__membership-grid',
              '.figma-home__membership-card',
              '.figma-home__membership-card h3',
              '.figma-home__price',
              '.figma-home__membership-button',
              '.business-public-shell__header-inner',
              '.business-public-shell__header-actions',
              '.business-landing h1',
              '.business-landing__button',
              '.business-landing__benefit',
            ].join(',')
            const clipped = Array.from(document.querySelectorAll<HTMLElement>(criticalSelector))
              .filter((element) => element.offsetParent !== null)
              .map((element) => {
                const rect = element.getBoundingClientRect()
                return {
                  selector: element.className || element.tagName.toLowerCase(),
                  text: element.textContent?.replace(/\s+/g, ' ').trim().slice(0, 80) ?? '',
                  left: Math.round(rect.left),
                  right: Math.round(rect.right),
                }
              })
              .filter((element) => element.left < -1 || element.right > viewportWidth + 1)

            const membershipCards = Array.from(
              document.querySelectorAll<HTMLElement>('.figma-home__membership-card'),
            ).map((card) => card.getBoundingClientRect())
            const membershipCardsShareRow = membershipCards.length === 2
              && Math.abs(membershipCards[0].top - membershipCards[1].top) < 2

            const homeNav = document.querySelector<HTMLElement>('.figma-home__nav')
            const businessNav = document.querySelector<HTMLElement>('.business-public-shell__nav')

            return {
              documentOverflow: document.documentElement.scrollWidth - viewportWidth,
              clipped,
              membershipCardsShareRow,
              homeNavPosition: homeNav ? getComputedStyle(homeNav).position : null,
              businessNavPosition: businessNav ? getComputedStyle(businessNav).position : null,
            }
          })

          expect(layout.documentOverflow, `${tenant} ${route} at ${width}px`).toBeLessThanOrEqual(1)
          expect(layout.clipped, `${tenant} ${route} at ${width}px`).toEqual([])

          if (route === '/' && width <= 1050) {
            expect(layout.membershipCardsShareRow, `${tenant} membership cards at ${width}px`).toBe(false)
            expect(layout.homeNavPosition, `${tenant} home navigation at ${width}px`).toBe('fixed')
          }

          if (route === '/business' && width <= 820) {
            expect(layout.businessNavPosition, `${tenant} business navigation at ${width}px`).toBe('fixed')
          }
        }
      }
    })
  }
})
