import { expect, test, type Page } from '@playwright/test'

const memberEmail = process.env.E2E_CUSTOMER_EMAIL ?? 'customer@medellin.test'
const businessEmail = process.env.E2E_BUSINESS_OWNER_EMAIL ?? 'businesstest2@gmail.com'
const password = process.env.E2E_PASSWORD

if (!password) throw new Error('E2E_PASSWORD is required for the Medellin demo rehearsal.')

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
  await page.locator('#phone').fill('+57 300 555 0101')
  await page.locator('#location').fill('')
  await page.locator('#favoriteOrder').fill('')
  await page.getByRole('button', { name: /save changes/i }).click()
  await expect(page.getByText(/profile saved/i)).toBeVisible()
  await page.reload()
  await expect(page.locator('#phone')).toHaveValue('+57 300 555 0101')
  await expect(page.locator('body')).toContainText('+57 300 555 0101')

  await page.goto('/gift-cards')
  await expect(page.getByRole('button', { name: /add contact details/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^issue$/i }).first()).toBeVisible()

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
    '/business/member-sale',
    '/business/members',
    '/business/products',
    '/business/rewards',
    '/business/promotions',
    '/business/gift-cards',
    '/business/settings',
  ]) {
    await page.goto(path)
    await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
    await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)
  }

  expect(errors).toEqual([])
})
