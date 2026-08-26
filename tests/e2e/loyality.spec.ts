import { expect, test, type Page } from '@playwright/test'

import { e2ePassword } from './helpers/env.js'

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
      await expect(page.getByRole('heading', { name: /Your loyalty card,\s*reimagined\./ })).toBeVisible()
      await expect(page.getByLabel('Language')).toHaveCount(0)
      await expect(page.getByText('No POS integration needed')).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Built to bring customers in, and keep them coming back.' })).toBeVisible()
      await expect(page.getByRole('heading', { name: "White-label means it's yours, not ours." })).toBeVisible()
      await expect(page.locator('.reference-loyality')).toBeVisible()
      await expect(page.locator('.reference-loyality__nav')).toHaveCSS('position', 'sticky')
      await expect(page.locator('body')).not.toContainText(/RewardMe|Wondertown|Medellin|Guatemala/i)

      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        pageWidth: document.documentElement.scrollWidth,
        emptyLinks: Array.from(document.querySelectorAll('a[href]')).filter((anchor) => !anchor.getAttribute('href')?.trim()).length,
      }))
      expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewport + 1)
      expect(layout.emptyLinks).toBe(0)
      expect(errors).toEqual([])
    })
  }

  test('business and customer calls to action have real destinations', async ({ page }) => {
    await page.goto('/?tenant=loyality')
    const header = page.locator('.reference-loyality__nav')
    await expect(header.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin')
    await expect(header.getByRole('link', { name: 'See a Demo' })).toHaveAttribute('href', '/business')
    await expect(page.getByRole('link', { name: 'Request a Demo' })).toHaveAttribute('href', /^mailto:/)
    await expect(page.getByRole('link', { name: 'Sign In' }).last()).toHaveAttribute('href', '/signin')
    await page.getByRole('link', { name: 'Sign In' }).last().click()
    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByRole('group', { name: 'Choose sign-in account type' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible()
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
      await expect(page.getByLabel('Language')).toHaveCount(0)
      await expect(page.getByRole('group', { name: 'Choose sign-in account type' })).toHaveCount(0)

      await page.goto('/join?tenant=loyality')
      await expect(page.getByRole('heading', { name: 'Join the loop.' })).toBeVisible()
      await expect(page.getByLabel('Full name')).toBeVisible()
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
        await expect(page.getByLabel('Language')).toHaveCount(0)
        await page.setViewportSize({ width: 390, height: 844 })
        const layout = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          pageWidth: document.documentElement.scrollWidth,
        }))
        expect(layout.pageWidth, `${route} should not overflow on phone`).toBeLessThanOrEqual(layout.viewport + 1)
        await page.setViewportSize({ width: 1440, height: 900 })
      }
      expect(errors).toEqual([])
    })
  }
})
