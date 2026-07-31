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

  test('sign-in inputs and action have accessible names', async ({ page }) => {
    await page.goto('/signin?tenant=pinas')
    await expect(page.locator('#signin-email')).toBeVisible()
    await expect(page.locator('#signin-password')).toBeVisible()
    const submit = page.locator('form button[type="submit"]')
    await expect(submit).toBeVisible()
    await expect(submit).not.toHaveText('')
  })
})
