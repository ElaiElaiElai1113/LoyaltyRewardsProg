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
      await page.evaluate((includeRewardMeEditorialCards) => {
        const fixture = document.createElement('div')
        fixture.dataset.contrastFixture = 'true'
        const editorialCards = includeRewardMeEditorialCards ? `
          <article class="contrast-fixture__light-card bg-card">
            <h2>Light card title</h2>
            <p class="text-on-surface-variant/70">Readable supporting detail</p>
            <button class="contrast-fixture__primary bg-primary">Primary action</button>
            <button class="contrast-fixture__cta bg-tenant">Gold action</button>
          </article>
          <article class="contrast-fixture__luxe-card luxe-card">
            <h2>Luxe card title</h2>
            <p class="text-on-surface-variant/70">Readable luxe card detail</p>
            <div class="luxe-art">
              <span class="text-[var(--champagne)]/80">Curated pick</span>
              <strong class="text-[var(--cream)]">100 points</strong>
            </div>
          </article>
          <article class="contrast-fixture__catalog-card compact-catalog-card">
            <h2>Catalog card title</h2>
            <p class="text-on-surface-variant/70">Readable catalog detail</p>
          </article>
          <aside class="contrast-fixture__content-card" style="background-color: #fffdf7; color: #1f3a2e">
            <h2>Information card</h2>
            <p class="text-on-surface-variant/70">Ordinary asides remain light content cards</p>
          </aside>
          <section class="warm-hero-muted" style="background-color: #513315">
            <span class="text-[var(--champagne)]">Featured update</span>
            <h2>Dark feature card</h2>
            <p class="text-[var(--muted-foreground)]">Readable supporting detail on a dark card</p>
          </section>
        ` : ''
        fixture.innerHTML = `
          <main class="product-workspace-shell__main">
            ${editorialCards}
            <div class="membership-status-card">
              <span class="membership-status-card__title">Not active</span>
              <span class="membership-status-card__meta">Member status</span>
            </div>
          </main>
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
      }, tenant !== 'loyality')

      await expectReadableContrast(page.locator([
        '[data-contrast-fixture] .contrast-fixture__cta',
        '[data-contrast-fixture] .contrast-fixture__primary',
        '[data-contrast-fixture] .contrast-fixture__light-card h2',
        '[data-contrast-fixture] .contrast-fixture__light-card p',
        '[data-contrast-fixture] .contrast-fixture__luxe-card h2',
        '[data-contrast-fixture] .contrast-fixture__luxe-card > p',
        '[data-contrast-fixture] .luxe-art span',
        '[data-contrast-fixture] .luxe-art strong',
        '[data-contrast-fixture] .contrast-fixture__catalog-card h2',
        '[data-contrast-fixture] .contrast-fixture__catalog-card p',
        '[data-contrast-fixture] .contrast-fixture__content-card h2',
        '[data-contrast-fixture] .contrast-fixture__content-card p',
        '[data-contrast-fixture] .warm-hero-muted span',
        '[data-contrast-fixture] .warm-hero-muted h2',
        '[data-contrast-fixture] .warm-hero-muted p',
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
