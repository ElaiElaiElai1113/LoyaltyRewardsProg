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
const neighborEmail = process.env.E2E_TENANT_NEIGHBOR_EMAIL ?? ''
const businessOwnerEmail = process.env.E2E_TENANT_BUSINESS_OWNER_EMAIL ?? ''
const businessStaffEmail = process.env.E2E_TENANT_BUSINESS_STAFF_EMAIL ?? ''
const businessName = process.env.E2E_TENANT_BUSINESS_NAME ?? 'QA Partner'
const productName = process.env.E2E_TENANT_PRODUCT_NAME ?? 'QA Coffee'
const rewardName = process.env.E2E_TENANT_REWARD_NAME ?? 'QA Welcome Reward'
const giftCardName = process.env.E2E_TENANT_GIFT_CARD_NAME ?? 'QA Gift Card'
const giftCardCode = process.env.E2E_TENANT_GIFT_CARD_CODE ?? ''
const giftCardReceipt = process.env.E2E_TENANT_GIFT_CARD_RECEIPT ?? ''
const giftCardTotal = process.env.E2E_TENANT_GIFT_CARD_TOTAL ?? ''
const giftCardDiscount = process.env.E2E_TENANT_GIFT_CARD_DISCOUNT ?? ''
const giftCardFinalPrice = process.env.E2E_TENANT_GIFT_CARD_FINAL_PRICE ?? ''
const password = process.env.E2E_PASSWORD ?? ''

const escapedBusinessName = businessName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function monitorUnexpectedErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function expectNoHorizontalClipping(page: Page, context: string) {
  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth
    const clippedInteractiveElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a, button, input, select, textarea, summary, [role="button"], [role="tab"]',
      ),
    )
      .filter((element) => element.offsetParent !== null)
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          label: (element.textContent ?? element.getAttribute('aria-label') ?? '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        }
      })
      .filter(
        (element) =>
          (element.left < -1 && element.right > 1)
          || (element.right > viewportWidth + 1 && element.left < viewportWidth - 1),
      )

    return {
      overflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
      clippedInteractiveElements,
    }
  })

  expect(layout.overflow, `${context} document overflow`).toBeLessThanOrEqual(1)
  expect(layout.clippedInteractiveElements, `${context} clipped controls`).toEqual([])
}

async function signInCustomer(page: Page, email = customerEmail) {
  await page.goto('/signin')
  if (await page.locator('#signin-email').count() === 0) {
    test.skip(email !== customerEmail, 'Temporary test sign-in only exposes the primary customer account.')
    await page.getByRole('button', { name: 'Sign in as Customer', exact: true }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    return
  }
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#signin-email') })
    .locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard$/)
}

async function signInBusiness(page: Page, email = businessOwnerEmail) {
  await page.goto('/signin?portal=business')
  if (await page.locator('#signin-email').count() === 0) {
    test.skip(email !== businessOwnerEmail, 'Temporary test sign-in only exposes the business owner account.')
    await page.getByRole('button', { name: 'Sign in as Business', exact: true }).click()
    await expect(page).toHaveURL(/\/business\/dashboard$/)
    return
  }
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await page.locator('form').filter({ has: page.locator('#signin-email') })
    .locator('button[type="submit"]').click()
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
    await page.getByRole('button', { name: new RegExp(`(?:open business|abrir negocio) .*${escapedBusinessName}`, 'i') }).click()
    await expect(page.getByText(productName).first()).toBeVisible()
    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/gift-cards')
    await expect(page.getByText(giftCardName).first()).toBeVisible()
    expect(errors).toEqual([])
  })

  test('member home stays focused and uncluttered across screen sizes', async ({ page }) => {
    const errors = monitorUnexpectedErrors(page)
    await signInCustomer(page)

    for (const viewport of [
      { width: 320, height: 844 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]) {
      await page.setViewportSize(viewport)
      await page.goto('/dashboard')

      const wallet = page.getByRole('heading', { name: /your member wallet|tu billetera de miembro/i })
        .locator('xpath=ancestor::section[1]')
      await expect(wallet).toContainText(/account status|estado de la cuenta/i)
      await expect(wallet).toContainText(/active|activo/i)
      await expect(wallet).not.toContainText(/QR status|estado de QR|launch ready|listo para lanzamiento/i)
      await expect(wallet.getByRole('link', { name: /show member QR|mostrar QR de miembro/i })).toHaveCount(1)

      await expect(page.getByRole('heading', { name: /next steps|pr[oó]ximos pasos/i })).toHaveCount(0)
      await expect(page.getByRole('heading', { name: /contact details|datos de contacto/i })).toHaveCount(0)
      await expect(page.getByRole('heading', { name: /view history|ver historial/i })).toHaveCount(0)
      await expect(page.getByText(/walkthrough demo|demo guiada/i)).toHaveCount(0)
      await expect(page.getByRole('link', { name: /buy gift cards|comprar gift cards/i })).toBeVisible()
      await expectNoHorizontalClipping(page, `member dashboard at ${viewport.width}px`)
    }

    expect(errors).toEqual([])
  })

  test('second member login and session work', async ({ page }) => {
    test.skip(!neighborEmail, 'Set E2E_TENANT_NEIGHBOR_EMAIL to verify an optional second member.')
    const errors = monitorUnexpectedErrors(page)

    await signInCustomer(page, neighborEmail)
    await expect(page.locator('body')).toContainText(tenantName)
    await page.reload()
    await expect(page).toHaveURL(/\/dashboard$/)
    await page.goto('/profile')
    await expect(page.getByRole('heading', { name: /page not found/i })).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('member gift-card wallet remains usable at the smallest supported mobile width', async ({ page }) => {
    const errors = monitorUnexpectedErrors(page)
    await page.setViewportSize({ width: 320, height: 844 })
    await signInCustomer(page)
    await page.goto('/wallet/gift-cards')

    await expect(page.getByRole('heading', { name: 'Gift Cards', exact: true })).toBeVisible()
    for (const status of ['Active', 'Redeemed', 'Expired']) {
      await expect(page.getByRole('tab', { name: new RegExp(status, 'i') })).toBeVisible()
    }
    await page.getByRole('tab', { name: /redeemed/i }).click()
    if (giftCardCode) {
      await expect(page.getByText(giftCardCode, { exact: true })).toBeVisible()
    }
    await expectNoHorizontalClipping(page, 'member gift-card wallet at 320px')
    expect(errors).toEqual([])
  })

  test('business owner session, customer search, catalog, and points award work', async ({ page }) => {
    const errors = monitorUnexpectedErrors(page)
    await signInBusiness(page)
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
    await expect(page.getByText(rewardName).first()).toBeVisible()

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

  test('business staff login and staff-safe operations work', async ({ page }) => {
    test.skip(!businessStaffEmail, 'Set E2E_TENANT_BUSINESS_STAFF_EMAIL to verify optional staff access.')
    const errors = monitorUnexpectedErrors(page)

    await signInBusiness(page, businessStaffEmail)
    await expect(page.locator('body')).toContainText(tenantName)
    await page.reload()
    await expect(page).toHaveURL(/\/business\/dashboard$/)

    for (const path of ['/business/redemptions', '/business/members', '/business/partners']) {
      await page.goto(path)
      await expect(page).toHaveURL(new RegExp(`${path.replaceAll('/', '\\/')}$`))
      await expect(page.getByRole('heading', { name: /page not found/i })).toHaveCount(0)
      await expect(page.locator('body')).not.toContainText(/application error|something went wrong/i)
    }

    expect(errors).toEqual([])
  })

  test('business transaction history remains accurate and responsive on mobile', async ({ page }) => {
    const errors = monitorUnexpectedErrors(page)
    await page.setViewportSize({ width: 320, height: 844 })
    await signInBusiness(page)
    await page.goto('/business/redemptions')

    await expect(page.getByRole('heading', { name: 'Transaction History', exact: true })).toBeVisible()
    await expectNoHorizontalClipping(page, 'business transaction history at 320px')

    if (giftCardReceipt) {
      const transaction = page.locator(`[data-transaction-receipt="${giftCardReceipt}"]`)
      await expect(transaction).toBeVisible()
      if (giftCardTotal) {
        await expect(transaction.getByTestId('transaction-total')).toHaveText(giftCardTotal)
      }
      if (giftCardDiscount) {
        await expect(transaction.getByTestId('transaction-gift-card-discount')).toHaveText(giftCardDiscount)
      }
      if (giftCardFinalPrice) {
        await expect(transaction.getByTestId('transaction-final-price')).toHaveText(giftCardFinalPrice)
      }
    }

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
