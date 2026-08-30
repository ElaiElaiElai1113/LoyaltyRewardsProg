import { expect, test, type Page } from '@playwright/test'

const legalRoutes = [
  ['/terms', 'Terms of Use'],
  ['/privacy', 'Privacy Policy'],
  ['/reward-terms', 'Reward Terms'],
  ['/verification-policy', 'Verification Policy'],
] as const

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(message.text())
    }
  })
  return errors
}

async function expectSemanticMobileLayout(page: Page, headingToken = '--primary-container') {
  const layout = await page.locator('.product-legal-shell').evaluate((main, expectedHeadingToken) => {
    const viewport = document.documentElement.clientWidth
    const resolveColor = (token: string) => {
      const probe = document.createElement('span')
      probe.style.color = `var(${token})`
      document.body.append(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    }
    const clippedControls = Array.from(main.querySelectorAll<HTMLElement>('a, button, input, select, textarea'))
      .filter((element) => {
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        return style.display !== 'none'
          && style.visibility !== 'hidden'
          && rect.width > 0
          && rect.height > 0
          && (rect.left < -1 || rect.right > viewport + 1)
      })
      .map((element) => element.textContent?.trim() || element.tagName)
    const card = main.querySelector('section')
    const heading = main.querySelector('h1')
    const badge = main.querySelector('[class*="bg-[var(--accent)]"]')

    return {
      pageWidth: document.documentElement.scrollWidth,
      viewport,
      clippedControls,
      mainBackground: getComputedStyle(main).backgroundColor,
      cardBackground: card ? getComputedStyle(card).backgroundColor : '',
      headingColor: heading ? getComputedStyle(heading).color : '',
      badgeBackground: badge ? getComputedStyle(badge).backgroundColor : '',
      expectedBackground: resolveColor('--background'),
      expectedCard: resolveColor('--card'),
      expectedHeading: resolveColor(expectedHeadingToken),
      expectedBadge: resolveColor('--accent'),
    }
  }, headingToken)

  expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1)
  expect(layout.clippedControls).toEqual([])
  expect(layout.mainBackground).toBe(layout.expectedBackground)
  expect(layout.cardBackground).toBe(layout.expectedCard)
  expect(layout.headingColor).toBe(layout.expectedHeading)
  expect(layout.badgeBackground).toBe(layout.expectedBadge)
}

test.describe('tenant-aware legal surfaces', () => {
  test('Loyality legal routes use customer-account language and its semantic theme at 320px', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.setViewportSize({ width: 320, height: 844 })

    for (const [route, heading] of legalRoutes) {
      await page.goto(`${route}?tenant=loyality`)
      await expect(page.locator('html')).toHaveAttribute('data-program', 'loyality')
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Create customer account' })).toHaveAttribute('href', '/join')
      await expect(page.locator('body')).not.toContainText(/RewardMe|Wondertown|Medellin|pending final legal approval|active membership status|completed ID verification/i)
      await expectSemanticMobileLayout(page)
    }

    await page.goto('/terms?tenant=loyality')
    await expect(page.getByText('Creating a standard customer account is free.', { exact: false })).toBeVisible()
    const loyalityAccentTokens = await page.evaluate(() => {
      const resolveColor = (token: string) => {
        const probe = document.createElement('span')
        probe.style.color = `var(${token})`
        document.body.append(probe)
        const value = getComputedStyle(probe).color
        probe.remove()
        return value
      }
      return {
        tenantAccent: resolveColor('--tenant-accent'),
        tenantAccentForeground: resolveColor('--tenant-accent-foreground'),
        tenantAccentSoft: resolveColor('--tenant-accent-soft'),
        teal: resolveColor('--secondary'),
        white: resolveColor('--primary-foreground'),
        tealSoft: resolveColor('--accent'),
      }
    })
    expect(loyalityAccentTokens.tenantAccent).toBe(loyalityAccentTokens.teal)
    expect(loyalityAccentTokens.tenantAccentForeground).toBe(loyalityAccentTokens.white)
    expect(loyalityAccentTokens.tenantAccentSoft).toBe(loyalityAccentTokens.tealSoft)
    await page.goto('/verification-policy?tenant=loyality')
    await expect(page.getByText('does not require a paid membership or government ID', { exact: false })).toBeVisible()
    expect(errors).toEqual([])
  })

  test('Wondertown legal routes disclose fictional test-only behavior at 320px', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.setViewportSize({ width: 320, height: 844 })

    for (const [route, heading] of legalRoutes) {
      await page.goto(`${route}?tenant=wondertown`)
      await expect(page.locator('html')).toHaveAttribute('data-program', 'wondertown')
      await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expect(page.getByText('fictional demo environment', { exact: false })).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/RewardMe|Medellin|pending final legal approval|active membership status|completed ID verification/i)
      await expectSemanticMobileLayout(page, '--foreground')
    }

    await page.goto('/terms?tenant=wondertown')
    await expect(page.getByText('does not sell a paid membership', { exact: false })).toBeVisible()
    await page.goto('/verification-policy?tenant=wondertown')
    await expect(page.getByText('Never upload or enter a real identity document', { exact: false })).toBeVisible()
    expect(errors).toEqual([])
  })
})
