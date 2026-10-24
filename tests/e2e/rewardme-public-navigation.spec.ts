import { expect, test } from '@playwright/test'

for (const tenant of ['pinas', 'wondertown']) {
  test.describe(`${tenant} public navigation`, () => {
    test.beforeEach(async ({ page }) => {
      // Presentation checks remain local and never contact providers or hosted data.
      await page.route('**/*', (route) => {
        const hostname = new URL(route.request().url()).hostname
        return ['127.0.0.1', 'localhost'].includes(hostname) ? route.continue() : route.abort()
      })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/?tenant=${tenant}`)
      await expect(page.locator('[data-rewardme-editorial-home]')).toBeVisible()
    })

    test('closes on outside click, Escape, links, and a desktop resize', async ({ page }) => {
      const toggle = page.locator('.reference-rewardme__menu-toggle')
      const menu = page.locator('#rewardme-mobile-navigation')
      await toggle.click()
      await expect(menu).toBeVisible()
      await page.mouse.click(5, 820)
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.focus()
      await page.keyboard.press('Enter')
      await expect(menu).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(toggle).toBeFocused()
      await expect(menu).toBeHidden()
      await toggle.click()
      await page.setViewportSize({ width: 1440, height: 900 })
      await expect(menu).toBeHidden()
      await page.setViewportSize({ width: 390, height: 844 })
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await toggle.click()
      await menu.locator('a[href="#how"]').click()
      await expect(menu).toBeHidden()
      await expect(page.locator('#how')).toBeInViewport()
      await expect(menu.locator('a[href="#how"]')).toHaveAttribute('aria-current', 'location')
      await page.locator('#store').scrollIntoViewIfNeeded()
      await expect(menu.locator('a[href="#store"]')).toHaveAttribute('aria-current', 'location')
    })

    test('retains real account destinations and tenant-specific branding', async ({ page }) => {
      const header = page.locator('.reference-rewardme__header')
      const logo = header.locator('.reference-rewardme__logo')
      await expect(logo).toHaveAttribute('href', '#top')
      await expect(logo).toHaveAccessibleName(tenant === 'wondertown' ? 'Wondertown Rewards homepage' : 'RewardMe homepage')
      await expect(logo.locator('img')).toHaveAttribute('src', tenant === 'wondertown' ? '/wondertown-rewards-logo.svg' : '/rewardme-client-logo-132.webp')
      await header.locator('.reference-rewardme__menu-toggle').click()
      const menu = page.locator('#rewardme-mobile-navigation')
      await expect(menu.locator('a[href="/join"]')).toBeVisible()
      await menu.locator('a[href="/signin"]').click()
      await expect(page).toHaveURL(/\/signin/)
      await expect(page.getByRole('textbox').first()).toBeVisible()
      await page.goto(`/business?tenant=${tenant}`)
      await expect(header.locator('.reference-rewardme__logo')).toHaveAttribute('href', '/')
      await header.locator('.reference-rewardme__menu-toggle').click()
      await expect(menu.locator('a[href="/#store"]')).toBeVisible()
      await menu.locator('a[href="/#store"]').click()
      await expect(page.locator('[data-rewardme-editorial-home]')).toBeVisible()
      await expect(page.locator('#store')).toBeInViewport()
      await expect(menu).toBeHidden()
    })
  })
}
