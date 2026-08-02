import { expect, test, type Page } from '@playwright/test'

import {
  getLatestMemberTransactionByNote,
  getProfileByEmail,
  getRewardBalance,
  getSupabaseSessionClient,
  type E2EProfile,
} from './helpers/supabase.js'

const enabled = process.env.E2E_INCLUDE_TENANT_AUTH_SMOKE === 'true'
const tenantName = process.env.E2E_TENANT_NAME ?? ''
const customerEmail = process.env.E2E_TENANT_CUSTOMER_EMAIL ?? ''
const businessOwnerEmail = process.env.E2E_TENANT_BUSINESS_OWNER_EMAIL ?? ''
const password = process.env.E2E_PASSWORD ?? ''

function monitorUnexpectedErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function signInCustomer(page: Page) {
  await page.goto('/signin')
  await page.locator('#signin-email').fill(customerEmail)
  await page.locator('#signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#signin-email') })
    .getByRole('button', { name: /sign in|iniciar/i }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function signInBusinessOwner(page: Page) {
  await page.goto('/business/login')
  await page.locator('#staff-signin-email').fill(businessOwnerEmail)
  await page.locator('#staff-signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#staff-signin-email') })
    .getByRole('button', { name: /sign in|iniciar/i }).click()
  await expect(page).toHaveURL(/\/business\/dashboard$/)
}

test.describe.serial('permanent authenticated tenant smoke', () => {
  test.skip(!enabled, 'Set E2E_INCLUDE_TENANT_AUTH_SMOKE=true with an isolated tenant QA fixture.')

  let memberProfile: E2EProfile
  let startingPoints = 0
  const transactionNote = `tenant-live-smoke-${Date.now()}`

  test('member login, session, profile, and tenant catalogs work', async ({ page }) => {
    const errors = monitorUnexpectedErrors(page)
    const customerClient = await getSupabaseSessionClient(customerEmail)
    memberProfile = await getProfileByEmail(customerClient, customerEmail)
    startingPoints = (await getRewardBalance(customerClient, memberProfile.id)).points
    expect(memberProfile.memberQrToken).toBeTruthy()

    await signInCustomer(page)
    await expect(page.locator('body')).toContainText(tenantName)
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard$/)

    for (const path of ['/profile', '/shop', '/gift-cards', '/membership', '/activity', '/cart']) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
      await expect(page.getByRole('heading', { name: /page not found/i })).toHaveCount(0)
      await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)
    }

    await page.goto('/shop')
    await page.getByRole('button', { name: /(?:open business|abrir negocio) .*qa partner/i }).click()
    await expect(page.getByText('QA Coffee').first()).toBeVisible()
    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/gift-cards')
    await expect(page.getByText('QA Gift Card').first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('business owner session, customer search, catalog, and points award work', async ({ page }) => {
    const errors = monitorUnexpectedErrors(page)
    await signInBusinessOwner(page)
    await expect(page.locator('body')).toContainText(tenantName)
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
      await expect(page.getByRole('heading', { name: /page not found/i })).toHaveCount(0)
      await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)
    }

    await page.goto('/business/members')
    await expect(page.locator('p').filter({ hasText: memberProfile.fullName }).first()).toBeVisible()
    await page.getByPlaceholder(/search by name, email, or customer id|buscar por nombre, correo o id/i).fill(memberProfile.id)
    await expect(page.locator('p').filter({ hasText: memberProfile.fullName }).first()).toBeVisible()

    await page.goto('/business/rewards')
    await expect(page.getByText('QA Welcome Reward').first()).toBeVisible()

    await page.goto(`/business/member-sale/${memberProfile.memberQrToken}`)
    await page.locator('#purchaseAmount').fill('20')
    await page.locator('#receiptNumber').fill(`E2E-${transactionNote}`)
    await page.locator('#note').fill(transactionNote)
    await page.getByRole('button', { name: /record sale|registrar venta/i }).click()
    await expect(page.locator('body')).toContainText(/transaction recorded|transacci[oó]n registrada/i)

    const ownerClient = await getSupabaseSessionClient(businessOwnerEmail)
    const transaction = await getLatestMemberTransactionByNote(ownerClient, transactionNote)
    expect(transaction.profileId).toBe(memberProfile.id)
    expect(transaction.pointsAwarded).toBeGreaterThan(0)
    expect(errors).toEqual([])
  })

  test('member sees the awarded points after signing in again', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(customerEmail)
    const updatedBalance = await getRewardBalance(customerClient, memberProfile.id)
    expect(updatedBalance.points).toBeGreaterThan(startingPoints)

    await signInCustomer(page)
    await page.goto('/activity')
    await expect(page.locator('body')).toContainText(/purchase at|compra en|points earned|puntos ganados/i)
  })
})
