import { expect, test, type Page } from '@playwright/test'

import { e2ePassword } from './helpers/env.js'
import { PASSWORD_MIN_LENGTH } from '../../src/lib/password-setup.js'

function runtimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  return errors
}

test.describe('Loyality public product', () => {
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
      await expect(page.getByRole('heading', { name: 'Turn your customers into members.' })).toBeVisible()
      await expect(page.getByLabel('Language')).toBeVisible()
      for (const heading of [
        'One membership. Any incentive you want.',
        "A partner that runs it with you — not a tool you're left to figure out.",
        'A membership does three jobs at once.',
        'Four steps, fully automated after launch.',
        "Everything a loyalty app does. Plus what most of them don't.",
        "Built to run under your name, not someone else's.",
        "We're confident enough to put it in writing.",
        'What a membership tier could look like.',
        'Onboarding, made simple.',
        'Ready to turn your customers into members?',
      ]) await expect(page.getByRole('heading', { name: heading })).toBeVisible()
      await expect(page.locator('.reference-loyality')).toBeVisible()
      await expect(page.locator('.reference-loyality__header')).toHaveCSS('position', 'sticky')
      await expect(page.locator('body')).not.toContainText(/RewardMe|Wondertown|Medellin|Guatemala/i)
      const photos = page.locator('.reference-loyality__photo img')
      await expect(photos).toHaveCount(2)
      for (let index = 0; index < 2; index += 1) {
        const photo = photos.nth(index)
        await photo.scrollIntoViewIfNeeded()
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
      expect(layout.headingFont).toContain('Fraunces')
      expect(layout.labelFont).toContain('IBM Plex Mono')
      expect(layout.background).toBe('rgb(246, 241, 228)')
      expect(layout.headingColor).toBe('rgb(31, 58, 46)')
      expect(errors).toEqual([])
    })
  }

  test('business and customer calls to action have real destinations', async ({ page }) => {
    await page.goto('/?tenant=loyality')
    const header = page.locator('.reference-loyality__nav')
    await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
    await expect(header.getByRole('link', { name: 'Get started' })).toHaveAttribute('href', '#pricing')
    await expect(page.getByRole('link', { name: 'See the concept' })).toHaveAttribute('href', '#concept')
    await expect(page.locator('a[href^="mailto:"]').filter({ hasText: 'Get started' }).last()).toHaveAttribute('href', /^mailto:/)
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

      await page.getByLabel('Language').selectOption('es')
      await expect(page.locator('html')).toHaveAttribute('lang', 'es')
      await expect(page.getByLabel('Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Convierte a tus clientes en miembros.' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Turn your customers into members.' })).toHaveCount(0)

      await page.goto('/business?tenant=loyality')
      await expect(page.getByLabel('Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Un programa de fidelidad que se siente como tu negocio.' })).toBeVisible()

      await page.goto('/signin?tenant=loyality')
      await expect(page.getByLabel('Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Entra en tu ciclo.' })).toBeVisible()

      await page.goto('/join?tenant=loyality')
      await expect(page.getByLabel('Idioma')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Únete al ciclo.' })).toBeVisible()

      await page.goto('/promotions?tenant=loyality')
      await expect(page.getByLabel('Idioma')).toBeVisible()
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
      await expect(page.getByLabel('Language')).toBeVisible()
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

test.describe('Loyality signed-in visual system', () => {
  test.skip(process.env.LOYALITY_E2E_AUTH_ENABLED !== 'true', 'Live Loyality QA accounts are required.')

  test('customer commerce endpoints return to the Loyality dashboard', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/signin')
    await page.getByLabel('Email address').fill('customer@loyality.test')
    await page.locator('#loyality-password').fill(e2ePassword)
    await page.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)

    for (const route of [
      '/shop',
      '/membership',
      '/guide',
      '/gift-cards',
      '/wallet/gift-cards',
      '/cart',
      '/checkout',
      '/order-confirmation',
      '/orders',
    ]) {
      await page.goto(route)
      await expect.poll(() => new URL(page.url()).pathname, `${route} should return to the dashboard`).toBe('/dashboard')
      await expect(page.locator('body')).not.toContainText(/Partner Businesses|Mock Membership|Golden Circle/i)
    }
  })

  for (const account of [
    {
      portal: 'customer', email: 'customer@loyality.test', shell: '.ly-shell--customer', destination: /\/dashboard/,
      routes: ['/dashboard', '/promotions', '/profile', '/activity'],
    },
    {
      portal: 'business', email: 'owner@loyality.test', shell: '.ly-workspace--business', destination: /\/business\/dashboard/,
      routes: ['/business/dashboard', '/business/members', '/business/growth', '/business/redemptions', '/business/settings', '/business/guide'],
    },
    {
      portal: 'admin', email: 'admin@loyality.test', shell: '.ly-workspace--admin', destination: /\/admin\/portal/,
      routes: ['/admin/portal', '/admin/programs', '/admin/memberships', '/admin/readiness', '/admin/gift-cards', '/admin/guide'],
    },
  ]) {
    test(`${account.portal} uses the Loyality shell on desktop and phone`, async ({ page }) => {
      const errors = runtimeErrors(page)
      await page.goto('/signin')
      await page.getByLabel('Email address').fill(account.email)
      await page.locator('#loyality-password').fill(e2ePassword)
      await page.getByRole('button', { name: 'Sign in', exact: true }).click()
      await expect(page).toHaveURL(account.destination)
      for (const route of account.routes) {
        await page.goto(route)
        await expect(page.locator(account.shell)).toBeVisible()
        await expect(page.locator('.soft-luxe-shell')).toHaveCount(0)
        expect(await page.getByLabel(/Language|Idioma/).count()).toBeGreaterThan(0)
        for (const width of [320, 390]) {
          await page.setViewportSize({ width, height: 844 })
          const layout = await page.evaluate(() => {
            const viewport = document.documentElement.clientWidth
            const clippedControls = Array.from(document.querySelectorAll<HTMLElement>('button, input, select, textarea, a'))
              .filter((element) => {
                const rect = element.getBoundingClientRect()
                const style = window.getComputedStyle(element)
                return style.display !== 'none'
                  && style.visibility !== 'hidden'
                  && rect.width > 0
                  && rect.height > 0
                  && rect.left < viewport
                  && rect.right > viewport + 1
                  && rect.top < window.innerHeight
                  && rect.bottom > 0
              })
              .map((element) => element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName)

            return {
              viewport,
              pageWidth: document.documentElement.scrollWidth,
              clippedControls,
            }
          })
          expect(layout.pageWidth, `${route} should not overflow at ${width}px`).toBeLessThanOrEqual(layout.viewport + 1)
          expect(layout.clippedControls, `${route} controls should remain usable at ${width}px`).toEqual([])
        }
        await page.setViewportSize({ width: 1440, height: 900 })
      }
      expect(errors).toEqual([])
    })
  }
})
