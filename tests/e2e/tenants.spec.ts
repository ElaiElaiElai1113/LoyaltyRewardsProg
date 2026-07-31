import { expect, test, type Page } from '@playwright/test'

const tenants = [
  { slug: 'medellin', name: 'Medellin Rewards', color: '#9c6a22' },
  { slug: 'guatemala', name: 'Guatemala Rewards', color: '#176b5b' },
  { slug: 'synergize', name: 'Synergize', color: '#2357a5' },
  { slug: 'pinas', name: 'Pinas Rewards', color: '#a67608' },
] as const

function collectRuntimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('requestfailed', (request) => errors.push(`${request.url()}: ${request.failure()?.errorText ?? 'request failed'}`))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  return errors
}

test.describe('white-label tenant resolution', () => {
  for (const tenant of tenants) {
    test(`${tenant.name} loads isolated branding without runtime errors`, async ({ page }) => {
      const errors = collectRuntimeErrors(page)
      await page.addInitScript((slug) => window.localStorage.setItem(`rewards:${slug}:language`, 'en'), tenant.slug)
      await page.goto(`/?tenant=${tenant.slug}`)

      await expect(page).toHaveTitle(tenant.name)
      await expect(page.locator('.figma-home__brand').first()).toContainText(tenant.name.toUpperCase())
      await expect(
        page.getByRole('heading', { name: 'Earn Amazing Rewards While Supporting Local Businesses' }),
      ).toBeVisible()
      await expect(page.locator('body')).not.toContainText(/\bheadline\b/i)
      await expect(page.locator('html')).toHaveCSS('--tenant-accent', tenant.color)
      await expect(page.locator('body')).not.toContainText('Loading rewards program...')
      expect(errors).toEqual([])

      await page.reload()
      await expect(page).toHaveTitle(tenant.name)
      if (tenant.slug !== 'pinas') {
        await expect(page.locator('body')).not.toContainText('Pinas Rewards')
      }
    })
  }

  test('tenant selection survives navigation to the public business catalog', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/?tenant=pinas')
    await page.locator('a[href="/business"]').first().click()
    await expect(page).toHaveURL(/\/business/)
    await expect(page).toHaveTitle('Pinas Rewards')
    expect(errors).toEqual([])
  })

  test('platform program console remains protected for signed-out visitors', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/admin/programs')
    await expect(page).toHaveURL(/\/admin\?redirect=%2Fadmin%2Fprograms$/)
    await expect(page.locator('#staff-signin-email')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('tenant administration remains protected for signed-out visitors', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/program/settings?tenant=guatemala')
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fprogram%2Fsettings&tenant=guatemala$/)
    await expect(page.locator('#signin-email')).toBeVisible()
    await expect(page).toHaveTitle('Guatemala Rewards')
    expect(errors).toEqual([])
  })

  test('self-service program onboarding requires authentication', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/onboarding/program?tenant=pinas')
    await expect(page).toHaveURL(/\/signin\?redirect=%2Fonboarding%2Fprogram&tenant=pinas/)
    await expect(page.locator('#signin-email')).toBeVisible()
    await expect(page).toHaveTitle('Pinas Rewards')
    expect(errors).toEqual([])
  })

  test('early-access copy follows the selected tenant', async ({ page }) => {
    const errors = collectRuntimeErrors(page)
    await page.goto('/invitation?tenant=guatemala')
    await expect(page).toHaveTitle('Guatemala Rewards')
    await expect(page.locator('main')).toContainText('Guatemala Rewards')
    await expect(page.locator('main')).not.toContainText('Medellin Rewards')
    expect(errors).toEqual([])
  })
})
