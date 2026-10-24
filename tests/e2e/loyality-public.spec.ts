import { readFileSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

import { PASSWORD_MIN_LENGTH } from '../../src/lib/password-setup.js'

function runtimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  return errors
}

function publicLanguagePicker(page: Page, language: 'Language' | 'Idioma') {
  return page.locator('.main-site-language-dock').getByRole('combobox', { name: language, exact: true })
}

const referenceCopy = JSON.parse(readFileSync(new URL('../fixtures/loyality-reference-copy.json', import.meta.url), 'utf8')) as { sections: Record<string, string[]> }

test.describe('Loyality public product', () => {
  test('homepage restores every supplied PDF copy entry', async ({ page }) => {
    await page.goto('/?tenant=loyality')
    for (const copy of Object.values(referenceCopy.sections).flat()) {
      await expect(page.locator('.reference-loyality').getByText(copy, { exact: true }).first(), copy).toBeVisible()
    }
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Your loyalty card, reimagined.')
    await expect(page.locator('.reference-loyality')).not.toContainText(/Guarantee terms|Paid tier|Grand slam offer|Illustrative example only/)
    for (const id of ['concept', 'support', 'how', 'ledger', 'features', 'guarantee', 'example']) {
      const alias = page.locator(`#${id}`)
      await expect(alias).toHaveCount(1)
      await expect(alias).toHaveCSS('height', '0px')
      await expect(alias).toHaveCSS('padding', '0px')
    }
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
    await expect(page.locator('.reference-loyality__nav-links a[href="#contact"]')).toHaveAttribute('aria-current', 'location')
  })

  test('signin and signup discard external and malformed destinations in both directions', async ({ page }) => {
    for (const candidate of ['https://example.com/outside', '//example.com/outside', '/\\example.com', '/offer/%ZZ', '/offer/%00welcome']) {
      await page.goto(`/signin?tenant=loyality&redirect=${encodeURIComponent(candidate)}`)
      await expect(page.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/join')
      await page.goto(`/join?tenant=loyality&redirect=${encodeURIComponent(candidate)}`)
      await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', '/signin')
    }
  })
  for (const viewport of [
    { name: 'phone', width: 360, height: 780 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`landing page is complete and responsive on ${viewport.name}`, async ({ page }) => {
      const errors = runtimeErrors(page)
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/?tenant=loyality')

      await expect(page).toHaveTitle('Loyality')
      await expect(page.getByRole('heading', { name: 'Your loyalty card, reimagined.' })).toBeVisible()
      await expect(publicLanguagePicker(page, 'Language')).toBeVisible()
      for (const heading of [
        'Harvest & Vine',
        'Built to bring customers in, and keep them coming back.',
        "White-label means it's yours, not ours.",
        'See it running for a business like yours.',
      ]) await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expect(page.locator('.reference-loyality')).toBeVisible()
      await expect(page.locator('.reference-loyality__header')).toHaveCSS('position', 'sticky')
      await expect(page.locator('body')).not.toContainText(/RewardMe|Wondertown|Medellin|Guatemala/i)
      const photos = page.locator('.reference-loyality__photo img')
      await expect(photos).toHaveCount(2)
      if (viewport.width <= 960) await expect(page.locator('.restored-benefit-photo img')).toHaveCSS('height', '320px')
      for (let index = 0; index < 2; index += 1) {
        const photo = photos.nth(index)
        await photo.scrollIntoViewIfNeeded()
        await expect(photo).toHaveCSS('object-fit', 'cover')
        await expect.poll(() => photo.evaluate((image) => {
          const element = image as HTMLImageElement
          return element.complete && element.naturalWidth > 0
        })).toBe(true)
      }

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        emptyLinks: Array.from(document.querySelectorAll('a[href]')).filter((anchor) => !anchor.getAttribute('href')?.trim()).length,
        brokenHashLinks: Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
          .filter((anchor) => anchor.hash && !document.querySelector(anchor.hash)).map((anchor) => anchor.hash),
        bodyFont: getComputedStyle(document.body).fontFamily,
        headingFont: getComputedStyle(document.querySelector('.reference-loyality h1')!).fontFamily,
        labelFont: getComputedStyle(document.querySelector('.reference-loyality__eyebrow')!).fontFamily,
        background: getComputedStyle(document.querySelector('.reference-loyality')!).backgroundColor,
        headingColor: getComputedStyle(document.querySelector('.reference-loyality h1')!).color,
      }))
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1)
      expect(layout.emptyLinks).toBe(0)
      expect(layout.brokenHashLinks).toEqual([])
      expect(layout.bodyFont).toContain('IBM Plex Sans')
      expect(layout.headingFont).toContain('Space Grotesk')
      expect(layout.labelFont).toContain('IBM Plex Mono')
      expect(layout.background).toBe('rgb(248, 250, 246)')
      expect(layout.headingColor).toBe('rgb(21, 57, 46)')
      expect(errors).toEqual([])
    })
  }

  test('business and customer calls to action have real destinations', async ({ page }) => {
    await page.goto('/?tenant=loyality')
    const header = page.locator('.reference-loyality__nav')
    await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
    await expect(header.getByRole('link', { name: 'See a Demo' })).toHaveAttribute('href', '/business')
    await expect(page.locator('.reference-loyality__hero-ctas').getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '#how')
    const demoLinks = page.locator('.reference-loyality').getByRole('link', { name: /^(See a Demo|Request a Demo)$/ })
    await expect(demoLinks).toHaveCount(3)
    for (const link of await demoLinks.all()) await expect(link).toHaveAttribute('href', '/business')
    await page.getByRole('link', { name: 'Request a Demo' }).click()
    await expect(page).toHaveURL(/\/business$/)
    await expect(page.getByRole('heading', { name: 'A loyalty program that feels like your business.' })).toBeVisible()
    await page.goto('/?tenant=loyality')
    await expect(page.getByRole('link', { name: 'Sign in' }).last()).toHaveAttribute('href', '/signin')
    await header.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByRole('group', { name: 'Choose sign-in account type' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
  })

  test('signed-out offers explain the private-link flow instead of hanging', async ({ page }) => {
    await page.goto('/promotions?tenant=loyality')

    await expect(page.getByRole('heading', { name: 'Offers are shared privately' })).toBeVisible()
    await expect(page.getByText('Loading offers')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', '/signin?redirect=%2Fpromotions')
    await expect(page.getByRole('link', { name: 'Create customer account' })).toHaveAttribute('href', '/join?redirect=%2Fpromotions')
  })

  for (const viewport of [
    { name: 'phone', width: 320, height: 780 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`English and Spanish stay available across every Loyality public flow on ${viewport.name}`, async ({ page }) => {
      const errors = runtimeErrors(page)
      await page.setViewportSize(viewport)
      await page.goto('/?tenant=loyality')

      await publicLanguagePicker(page, 'Language').selectOption('es')
      await expect(page.locator('html')).toHaveAttribute('lang', 'es')
      await expect(publicLanguagePicker(page, 'Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu tarjeta de fidelidad, reinventada.')
      await expect(page.getByRole('heading', { name: 'Your loyalty card, reimagined.' })).toHaveCount(0)
      await expect(page.locator('.reference-loyality__footer').getByRole('link', { name: 'Contacto', exact: true })).toBeVisible()

      await page.goto('/business?tenant=loyality')
      await expect(publicLanguagePicker(page, 'Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Un programa de fidelidad que se siente como tu negocio.' })).toBeVisible()

      await page.goto('/signin?tenant=loyality')
      await expect(publicLanguagePicker(page, 'Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Entra en tu ciclo.' })).toBeVisible()

      await page.goto('/join?tenant=loyality')
      await expect(publicLanguagePicker(page, 'Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Únete al ciclo.' })).toBeVisible()

      await page.goto('/promotions?tenant=loyality')
      await expect(publicLanguagePicker(page, 'Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Las ofertas se comparten de forma privada' })).toBeVisible()

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
      }))
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1)
      expect(errors).toEqual([])
    })
  }

  test('legacy network and customer-commerce routes stay out of Loyality', async ({ page }) => {
    for (const [source, destination] of [
      ['/guide', '/'],
      ['/shop', '/'],
      ['/membership', '/join'],
      ['/cost-calculator', '/business'],
      ['/invitation', '/join'],
      ['/promo', '/'],
      ['/promo/register', '/'],
      ['/g/not-a-loyality-voucher', '/'],
    ] as const) {
      await page.goto(`${source}?tenant=loyality`)
      await expect.poll(() => new URL(page.url()).pathname, `${source} should redirect to ${destination}`).toBe(destination)
      await expect(page.locator('body')).not.toContainText(/Golden Circle|Partner Businesses|Mock Membership/i)
    }
  })

  test('join preserves only a safe internal destination', async ({ page }) => {
    const offerPath = '/offer/loyality-welcome?source=join'
    await page.goto(`/join?tenant=loyality&redirect=${encodeURIComponent(offerPath)}`)
    await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute(
      'href',
      `/signin?redirect=${encodeURIComponent(offerPath)}`,
    )

    await page.goto('/join?tenant=loyality&redirect=https%3A%2F%2Fexample.com%2Foutside')
    await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toHaveAttribute('href', '/signin')
  })

  for (const viewport of [
    { name: 'phone', width: 360, height: 780 },
    { name: 'desktop', width: 1440, height: 900 },
  ]) {
    test(`sign in and join continue the Loyality visual system on ${viewport.name}`, async ({ page }) => {
      const errors = runtimeErrors(page)
      await page.setViewportSize(viewport)

      await page.goto('/signin?tenant=loyality')
      await expect(page.locator('html')).toHaveAttribute('data-program', 'loyality')
      await expect(page.getByRole('heading', { name: 'Return. Recognized. Rewarded.' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Step into your loop.' })).toBeVisible()
      await expect(page.locator('.ly-auth')).toBeVisible()
      await expect(page.locator('.soft-luxe-shell')).toHaveCount(0)
      await expect(publicLanguagePicker(page, 'Language')).toBeVisible()
      await expect(page.getByRole('group', { name: 'Choose sign-in account type' })).toHaveCount(0)
      await expect(page.locator('.ly-auth')).toHaveCSS('background-color', 'rgb(246, 241, 228)')
      await expect(page.locator('.ly-auth__story h1')).toHaveCSS('font-family', /Fraunces/)
      await expect(page.locator('.ly-auth__eyebrow')).toHaveCSS('font-family', /IBM Plex Mono/)

      await page.goto('/join?tenant=loyality')
      await expect(page.getByRole('heading', { name: 'Join the loop.' })).toBeVisible()
      await expect(page.getByLabel('Full name')).toBeVisible()
      await expect(page.getByLabel('Create password')).toHaveAttribute('placeholder', `At least ${PASSWORD_MIN_LENGTH} characters`)
      await expect(page.locator('.ly-auth')).toBeVisible()

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
      }))
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1)
      expect(errors).toEqual([])
    })
  }
})
