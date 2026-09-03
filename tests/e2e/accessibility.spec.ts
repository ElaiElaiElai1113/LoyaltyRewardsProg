import { expect, test, type Locator } from '@playwright/test'

type Rgb = [number, number, number]

function relativeLuminance([red, green, blue]: Rgb) {
  const channels = [red, green, blue]
    .map((value) => value / 255)
    .map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrastRatio(foreground: Rgb, background: Rgb) {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background))
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background))
  return (lighter + 0.05) / (darker + 0.05)
}

async function expectReadableContrast(locator: Locator) {
  const samples = await locator.evaluateAll((elements) => elements.map((element) => {
    const parseRgb = (value: string) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? []
      return channels.slice(0, 3) as [number, number, number]
    }
    const foreground = parseRgb(getComputedStyle(element).color)
    let current: Element | null = element
    let background: [number, number, number] = [255, 255, 255]

    while (current) {
      const channels = getComputedStyle(current).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? []
      if ((channels[3] ?? 1) === 1) {
        background = channels.slice(0, 3) as [number, number, number]
        break
      }
      current = current.parentElement
    }

    return { background, foreground, text: element.textContent?.trim() ?? '' }
  }))

  for (const sample of samples) {
    expect(contrastRatio(sample.foreground, sample.background), `${sample.text} must meet WCAG AA contrast`).toBeGreaterThanOrEqual(4.5)
  }
}

test.describe('public keyboard accessibility', () => {
  test('primary navigation and controls are keyboard reachable', async ({ page }) => {
    await page.goto('/?tenant=medellin')
    await expect(page.getByRole('navigation').first()).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    const joinLink = page.locator('a[href="/join"]').first()
    await joinLink.focus()
    await expect(joinLink).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/join$/)
  })

  test('the unified sign-in form has an accessible name and labelled credentials', async ({ page }) => {
    await page.goto('/signin?tenant=pinas')
    await expect(page.getByRole('form', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.locator('[data-testid^="sign-in-portal-"]')).toHaveCount(0)
  })

  for (const tenant of ['rewardme', 'wondertown', 'loyality']) {
    test(`${tenant} cards, buttons, and workspace labels meet WCAG AA contrast`, async ({ page }) => {
      await page.goto(`/?tenant=${tenant}`)
      await page.evaluate(() => {
        const fixture = document.createElement('div')
        fixture.dataset.contrastFixture = 'true'
        fixture.innerHTML = `
          <button class="contrast-fixture__cta bg-tenant">Primary action</button>
          <div class="membership-status-card">
            <span class="membership-status-card__title">Not active</span>
            <span class="membership-status-card__meta">Member status</span>
          </div>
          <aside class="product-workspace-shell__sidebar">
            <span class="product-workspace-shell__identity-name">Partner business</span>
            <span class="product-workspace-shell__identity-description">Business overview</span>
            <a class="product-workspace-shell__nav-link product-workspace-shell__nav-link--active">Current section</a>
            <a class="product-workspace-shell__nav-link product-workspace-shell__nav-link--inactive">Other section</a>
            <span class="product-workspace-shell__profile-name">Account holder</span>
            <span class="product-workspace-shell__profile-role">Business owner</span>
          </aside>
        `
        document.body.append(fixture)
      })

      await expectReadableContrast(page.locator([
        '[data-contrast-fixture] .contrast-fixture__cta',
        '[data-contrast-fixture] .membership-status-card__title',
        '[data-contrast-fixture] .membership-status-card__meta',
        '[data-contrast-fixture] .product-workspace-shell__identity-name',
        '[data-contrast-fixture] .product-workspace-shell__identity-description',
        '[data-contrast-fixture] .product-workspace-shell__nav-link',
        '[data-contrast-fixture] .product-workspace-shell__profile-name',
        '[data-contrast-fixture] .product-workspace-shell__profile-role',
      ].join(', ')))
    })
  }
})
