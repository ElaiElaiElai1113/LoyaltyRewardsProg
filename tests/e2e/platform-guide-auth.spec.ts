import { expect, test, type Page } from '@playwright/test'

import { signInAdmin, signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'

async function guideHrefs(page: Page) {
  const hrefs = await page.getByTestId('platform-guide').locator('a[href]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  )
  return [...new Set(hrefs)].sort()
}

async function sidebarHrefs(page: Page) {
  return page.getByRole('complementary').locator('nav a[href]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href') ?? ''),
  )
}

const tagalogAdminOperationsLabels = [
  'Pangunahing Pahina',
  'Mga Promosyon',
  'Mga Katuwang',
  'Mga Kinatawan',
  'Mga Potensiyal na Kasapi',
  'Mga Pagsangguni',
  'Mga Kasunduan',
  'Aktibidad',
  'Mga Komisyon',
  'Gabay',
]

const tagalogBusinessStaffLabels = [
  'Pangunahing Pahina',
  'Mga Transaksiyon',
  'Mga Kostumer',
  'Mga Katuwang',
  'Gabay',
]

test.describe('authenticated platform guide workflow', () => {
  test.skip(!workflowAuthEnabled, 'Set E2E_AUTH_ENABLED=true after local Supabase is seeded to test portal guide routes.')

  test('admin can open the guide from the portal shell', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.addInitScript(() => window.localStorage.setItem('rewards:pinas:language', 'tl'))
    await signInAdmin(page, e2eAccounts.admin)

    const sidebar = page.getByRole('complementary')
    const guideLink = sidebar.getByRole('link', { name: 'Gabay', exact: true })
    const dashboardLink = sidebar.locator('a[href="/admin/portal"]')
    const operationsNavigation = await sidebarHrefs(page)

    expect(operationsNavigation).toHaveLength(tagalogAdminOperationsLabels.length)
    for (const label of tagalogAdminOperationsLabels) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
    await expect(dashboardLink).toHaveClass(/shadow-soft/)
    await guideLink.click()

    await expect(page).toHaveURL(/\/admin\/guide$/)
    await expect(page.getByRole('heading', { name: 'Gabay sa plataporma' })).toBeVisible()
    expect(await sidebarHrefs(page)).toEqual(operationsNavigation)
    await expect(guideLink).toHaveAttribute('href', '/admin/guide')
    await expect(guideLink).toHaveAttribute('aria-current', 'page')
    await expect(dashboardLink).not.toHaveClass(/shadow-soft/)
    await expect(sidebar.locator('a[aria-current="page"]')).toHaveCount(1)
    await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'admin')
    await expect(page.getByTestId('platform-guide').getByText('Mahahalagang gamit para sa tagapangasiwa')).toBeVisible()
    await expect(page.getByTestId('platform-guide').locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(0)
    await expect(page.getByText(/Screen storyboard|Storyboard con pantallas/)).not.toBeVisible()
    expect(await guideHrefs(page)).toEqual(['/admin/gift-cards', '/admin/memberships', '/admin/portal'])

    const layout = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>('main')!
      const shell = main.firstElementChild as HTMLElement
      const guide = document.querySelector<HTMLElement>('[data-testid="platform-guide"]')!
      const shellStyle = getComputedStyle(shell)
      const mainRect = main.getBoundingClientRect()
      const shellRect = shell.getBoundingClientRect()
      const guideRect = guide.getBoundingClientRect()
      const shellInnerWidth = shellRect.width
        - Number.parseFloat(shellStyle.paddingLeft)
        - Number.parseFloat(shellStyle.paddingRight)

      return {
        guideWidth: guideRect.width,
        mainWidth: mainRect.width,
        overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
        shellInnerWidth,
        shellWidth: shellRect.width,
      }
    })

    expect(layout.overflow, '1920px admin guide overflow').toBeLessThanOrEqual(2)
    expect(layout.shellWidth / layout.mainWidth, 'admin shell uses available desktop width').toBeGreaterThanOrEqual(0.98)
    expect(layout.guideWidth / layout.shellInnerWidth, 'admin guide uses available shell width').toBeGreaterThanOrEqual(0.98)
  })

  test('business staff can open the guide from the business shell', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('rewards:pinas:language', 'tl'))
    await signInBusinessPortal(page, e2eAccounts.businessStaff)

    await page.goto('/business/guide')
    const sidebar = page.getByRole('complementary')
    expect(await sidebarHrefs(page)).toHaveLength(tagalogBusinessStaffLabels.length)
    for (const label of tagalogBusinessStaffLabels) {
      await expect(sidebar.getByRole('link', { name: label, exact: true })).toBeVisible()
    }
    await expect(page).toHaveURL(/\/business\/guide$/)
    await expect(page.getByRole('heading', { name: 'Gabay sa plataporma' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Gabay' })).toHaveAttribute('href', '/business/guide')
    await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'business')
    await expect(page.getByTestId('platform-guide').getByText('Mahahalagang gamit para sa negosyo')).toBeVisible()
    await expect(page.getByTestId('platform-guide').locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(0)
    await expect(page.getByText(/Screen storyboard|Storyboard con pantallas/)).not.toBeVisible()
    expect(await guideHrefs(page)).toEqual([
      '/business/dashboard',
      '/business/members',
      '/business/redemptions',
    ])
  })

  test('customer sees only customer guidance and destinations', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('rewards:pinas:language', 'tl'))
    await signInCustomer(page, e2eAccounts.customer)

    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/guide')
      await expect(page).toHaveURL(/\/guide$/)
      await expect(page.getByRole('heading', { name: 'Gabay sa plataporma' })).toBeVisible()
      await expect(page.getByTestId('platform-guide')).toHaveAttribute('data-guide-audience', 'customer')
      await expect(page.getByTestId('platform-guide').getByText('Mahahalagang gamit para sa kostumer')).toBeVisible()
      await expect(page.getByTestId('platform-guide').locator('img[src*="/walkthrough-screenshots/"]')).toHaveCount(0)
      await expect(page.getByTestId('platform-guide').getByTestId('localized-guide-preview')).toHaveCount(1)
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
