import { expect, test } from '@playwright/test'

const tenantSlugs = ['pinas', 'pinasrewards', 'medellin', 'guatemala', 'wondertown', 'synergize', 'loyality'] as const
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
              '.figma-home__reward-badge',
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
              '.reference-rewardme__nav',
              '.reference-rewardme__nav-actions',
              '.reference-rewardme__hero',
              '.reference-rewardme__hero-copy',
              '.reference-rewardme__passbook',
              '.reference-rewardme__wide-photo',
              '.reference-rewardme__ledger-list li',
              '.reference-rewardme__rate-grid article',
              '.reference-rewardme__tiers article',
              '.reference-rewardme__business-card',
              '.reference-rewardme__button',
              '.reference-loyality__nav',
              '.reference-loyality__hero-grid',
              '.reference-loyality__feature-grid article',
              '.reference-loyality__process li',
              '.reference-loyality__pricing-grid article',
              '.loyality-business__hero-grid',
              '.loyality-business__program-card',
              '.loyality-business__benefits article',
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
            const referenceRewardMeNav = document.querySelector<HTMLElement>('.reference-rewardme__nav')
            const businessNav = document.querySelector<HTMLElement>('.business-public-shell__nav')

            return {
              documentOverflow: document.documentElement.scrollWidth - viewportWidth,
              clipped,
              membershipCardsShareRow,
              homeNavPosition: homeNav ? getComputedStyle(homeNav).position : null,
              referenceRewardMeNavDisplay: referenceRewardMeNav ? getComputedStyle(referenceRewardMeNav).display : null,
              businessNavPosition: businessNav ? getComputedStyle(businessNav).position : null,
            }
          })

          expect(layout.documentOverflow, `${tenant} ${route} at ${width}px`).toBeLessThanOrEqual(1)
          expect(layout.clipped, `${tenant} ${route} at ${width}px`).toEqual([])

          if (route === '/' && width <= 1050 && !['wondertown', 'pinas', 'loyality'].includes(tenant)) {
            expect(layout.membershipCardsShareRow, `${tenant} membership cards at ${width}px`).toBe(false)
            expect(layout.homeNavPosition, `${tenant} home navigation at ${width}px`).toBe('fixed')
          }

          if (route === '/' && (tenant === 'pinas' || tenant === 'wondertown')) {
            expect(layout.referenceRewardMeNavDisplay, `${tenant} home navigation at ${width}px`).toBe('flex')
          }

          if (route === '/business' && width <= 820) {
            expect(layout.businessNavPosition, `${tenant} business navigation at ${width}px`).toBe('absolute')
          }
        }
      }
    })
  }

  for (const tenant of ['pinas', 'wondertown', 'loyality'] as const) {
    test(`${tenant} provides a spacious mobile menu and floating language control`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/?tenant=${tenant}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor()

      const menuToggle = page.locator(
        tenant === 'loyality' ? '.reference-loyality__menu-toggle' : '.reference-rewardme__menu-toggle',
      )
      const mobileMenu = page.locator(
        tenant === 'loyality' ? '#loyality-mobile-navigation' : '#rewardme-mobile-navigation',
      )
      const languageDock = page.locator('.main-site-language-dock')

      await expect(menuToggle).toBeVisible()
      await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
      await menuToggle.click()
      await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')
      await expect(mobileMenu).toBeVisible()
      await expect(mobileMenu.getByRole('link', { name: 'Businesses', exact: true }).first()).toBeVisible()
      await expect(languageDock).toBeVisible()

      const dockBounds = await languageDock.boundingBox()
      expect(dockBounds).not.toBeNull()
      expect(dockBounds!.x + dockBounds!.width).toBeLessThanOrEqual(390)
      expect(dockBounds!.y + dockBounds!.height).toBeLessThanOrEqual(844)

      await page.goto(`/business?tenant=${tenant}`, { waitUntil: 'domcontentloaded' })
      const businessMenuToggle = page.locator('.business-public-shell__menu-toggle')
      const businessMenu = page.locator('#business-public-navigation')
      await expect(businessMenuToggle).toBeVisible()
      await businessMenuToggle.click()
      await expect(businessMenu).toBeVisible()
      await expect(businessMenu.getByRole('link', { name: 'Business Login', exact: true })).toBeVisible()
      await expect(page.locator('.main-site-language-dock')).toBeVisible()
    })

    test(`${tenant} keeps the business entry visible in the desktop top bar`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 })
      await page.goto(`/?tenant=${tenant}`, { waitUntil: 'domcontentloaded' })
      await page.locator('main').waitFor()

      const topBar = page.locator(
        tenant === 'loyality' ? '.reference-loyality__nav' : '.reference-rewardme__nav',
      )
      await expect(topBar.getByRole('link', {
        name: tenant === 'loyality' ? 'Get started' : 'Businesses',
        exact: true,
      })).toBeVisible()
    })
  }
})
