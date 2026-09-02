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

  test('the unified sign-in form has an accessible name and labelled credentials', async ({ page }) => {
    await page.goto('/signin?tenant=pinas')
    await expect(page.getByRole('form', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.locator('[data-testid^="sign-in-portal-"]')).toHaveCount(0)
  })
})
