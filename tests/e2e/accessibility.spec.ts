import { expect, test } from '@playwright/test'

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

  test('temporary test sign-in choices have accessible names', async ({ page }) => {
    await page.goto('/signin?tenant=pinas')
    for (const role of ['Admin', 'Business', 'Customer']) {
      await expect(page.getByRole('button', { name: `Sign in as ${role}`, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: /^Sign in as (Admin|Business|Customer)$/ })).toHaveCount(3)
  })
})
