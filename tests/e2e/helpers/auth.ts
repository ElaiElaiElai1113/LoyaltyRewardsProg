import { expect, type Page } from '@playwright/test'

import { e2ePassword } from './env.js'

export async function signInCustomer(page: Page, email: string, password = e2ePassword) {
  await page.goto('/signin')
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

export async function signInBusinessPortal(page: Page, email: string, password = e2ePassword) {
  await page.goto('/business/login')
  await page.locator('#staff-signin-email').fill(email)
  await page.locator('#staff-signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#staff-signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
  await expect(page).toHaveURL(/\/business\/dashboard$/)
}

export async function signInAdmin(page: Page, email: string, password = e2ePassword) {
  await page.goto('/admin')
  await page.locator('#staff-signin-email').fill(email)
  await page.locator('#staff-signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#staff-signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
  await expect(page).toHaveURL(/\/admin\/portal$/)
}
