import { expect, test, type Page } from '@playwright/test'

import { getProfileByEmail, getSupabaseSessionClient } from './helpers/supabase.js'

const memberEmail = process.env.E2E_CUSTOMER_EMAIL ?? 'customer@medellin.test'
const businessEmail = process.env.E2E_BUSINESS_OWNER_EMAIL ?? 'businesstest2@gmail.com'
const password = process.env.E2E_PASSWORD ?? ''

test.skip(!password, 'The Medellin demo rehearsal requires E2E_PASSWORD.')

function monitorUnexpectedErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

test('Medellin member can sign in and open demo pages', async ({ page }) => {
  const errors = monitorUnexpectedErrors(page)
  await page.goto('/signin')
  await page.locator('#signin-email').fill(memberEmail)
  await page.locator('#signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.locator('body')).toContainText('Medellin Rewards')

  await page.goto('/profile')
  await expect(page.locator('#fullName')).toHaveValue('E2E Verified Customer')
  await expect(page.getByText(/^(Frozen|Congelado)$/i)).toHaveCount(0)
  await expect(page.getByText(/^(Active|Activo)$/i).first()).toBeVisible()
  await page.locator('#phone').fill('+57 300 555 0101')
  await page.locator('#location').fill('')
  await page.locator('#favoriteOrder').fill('')
  await page.getByRole('button', { name: /save changes|guardar cambios/i }).click()
  await expect(page.getByRole('button', { name: /save changes|guardar cambios/i })).toBeEnabled()
  await page.reload()
  await expect(page.locator('#phone')).toHaveValue('+57 300 555 0101')
  await expect(page.locator('body')).toContainText('+57 300 555 0101')

  await page.goto('/gift-cards')
  await expect(page.getByRole('button', { name: /add contact details|agregar datos de contacto/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^(issue|emitir)$/i }).first()).toBeVisible()

  for (const path of ['/profile', '/shop', '/membership', '/activity', '/cart']) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
    await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)
  }

  await page.goto('/profile')
  await expect(page.getByText(/Member QR|QR de miembro/i).first()).toBeVisible()
  expect(errors).toEqual([])
})

test('Medellin business owner can sign in and open demo pages', async ({ page }) => {
  const errors = monitorUnexpectedErrors(page)
  const memberClient = await getSupabaseSessionClient(memberEmail)
  const memberProfile = await getProfileByEmail(memberClient, memberEmail)
  expect(memberProfile.memberQrToken).toBeTruthy()

  await page.goto('/business/login')
  await page.locator('#staff-signin-email').fill(businessEmail)
  await page.locator('#staff-signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#staff-signin-email') }).getByRole('button', { name: /sign in|iniciar/i }).click()
  await expect(page).toHaveURL(/\/business\/dashboard$/)
  await page.reload()
  await expect(page).toHaveURL(/\/business\/dashboard$/)
  await page.goto('/business/login')
  await expect(page).toHaveURL(/\/business\/dashboard$/)

  for (const path of [
    `/business/member-sale/${memberProfile.memberQrToken}`,
    '/business/members',
    '/business/products',
    '/business/rewards',
    '/business/promotions',
    '/business/gift-cards',
    '/business/settings',
  ]) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
    await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0)
    await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)
  }

  await page.goto('/business/members')
  await expect(page.locator('body')).toContainText('E2E Verified Customer')
  await page.getByPlaceholder(/Search by name, email, or customer ID/i).fill(memberProfile.id)
  await expect(page.getByText(/^E2E Verified Customer$/).first()).toBeVisible()

  expect(errors).toEqual([])
})
