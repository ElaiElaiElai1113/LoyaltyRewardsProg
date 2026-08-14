import { expect, test, type Page } from '@playwright/test'

import { signInAdmin, signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

async function guideHrefs(page: Page) {
  const hrefs = await page.getByTestId('platform-guide').locator('a[href]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  )
  return [...new Set(hrefs)].sort()
}

test.describe('authenticated platform guide workflow', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true after local Supabase is seeded to test portal guide routes.')

  test('admin can open the guide from the portal shell', async ({ page }) => {
    await signInAdmin(page, e2eAccounts.admin)

    await page.goto('/admin/guide')
    await expect(page).toHaveURL(/\/admin\/guide$/)
    await expect(page.getByRole('heading', { name: /Guia de la plataforma|Platform guide/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Guia' })).toHaveAttribute('href', '/admin/guide')
    await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'admin')
    await expect(page.getByTestId('platform-guide').locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(0)
    await expect(page.getByText(/Screen storyboard|Storyboard con pantallas/)).not.toBeVisible()
    expect(await guideHrefs(page)).toEqual(['/admin/gift-cards', '/admin/memberships', '/admin/portal'])
  })

  test('business staff can open the guide from the business shell', async ({ page }) => {
    await signInBusinessPortal(page, e2eAccounts.businessStaff)

    await page.goto('/business/guide')
    await expect(page).toHaveURL(/\/business\/guide$/)
    await expect(page.getByRole('heading', { name: /Guia de la plataforma|Platform guide/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Guia' })).toHaveAttribute('href', '/business/guide')
    await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'business')
    await expect(page.getByTestId('platform-guide').locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(0)
    await expect(page.getByText(/Screen storyboard|Storyboard con pantallas/)).not.toBeVisible()
    expect(await guideHrefs(page)).toEqual([
      '/business/dashboard',
      '/business/members',
      '/business/redemptions',
    ])
  })

  test('customer sees only customer guidance and destinations', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.customer)

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/guide')
      await expect(page).toHaveURL(/\/guide$/)
      await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'customer')
      await expect(page.getByTestId('platform-guide').locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(1)
      await expect(page.getByTestId('customer-guide-resource')).toBeVisible()
      await expect(page.getByTestId('platform-guide-next-step')).toHaveCount(0)
      await expect(page.getByText(/Screen storyboard|Storyboard con pantallas/)).not.toBeVisible()
      expect(await guideHrefs(page)).toEqual(['/dashboard', '/profile', '/shop'])

      const layout = await page.evaluate(() => {
        const media = document.querySelector<HTMLElement>('[data-testid="customer-guide-resource-media"]')!
        const content = document.querySelector<HTMLElement>('[data-testid="customer-guide-resource-content"]')!
        const mediaRect = media.getBoundingClientRect()
        const contentRect = content.getBoundingClientRect()
        return {
          contentLeft: Math.round(contentRect.left),
          contentTop: Math.round(contentRect.top),
          mediaBottom: Math.round(mediaRect.bottom),
          mediaRight: Math.round(mediaRect.right),
          mediaTop: Math.round(mediaRect.top),
          overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        }
      })

      expect(layout.overflow, `${viewport.width}px merged guide overflow`).toBeLessThanOrEqual(2)
      if (viewport.width >= 1024) {
        expect(Math.abs(layout.mediaTop - layout.contentTop), `${viewport.width}px merged guide columns`).toBeLessThanOrEqual(1)
        expect(layout.mediaRight, `${viewport.width}px merged guide media/content order`).toBeLessThanOrEqual(layout.contentLeft + 1)
      } else {
        expect(layout.mediaBottom, `${viewport.width}px merged guide stacking`).toBeLessThanOrEqual(layout.contentTop + 1)
      }
    }
  })
})
