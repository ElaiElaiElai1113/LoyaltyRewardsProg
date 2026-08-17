import { expect, test } from '@playwright/test'

import { signInAdmin, signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'
import {
  createGiftCardCatalogItem,
  getBusinessById,
  getBusinessBySlug,
  getGiftCardById,
  getLatestGiftCardForCustomer,
  getMemberTransactionByReceipt,
  getProfileByEmail,
  getRewardBalance,
  getSupabaseSessionClient,
  issueGiftCardForCustomer,
  recordMemberQrSale,
  redeemGiftCardForBusiness,
} from './helpers/supabase.js'

test.describe.serial('gift card issue and redeem workflow automation', () => {
  test.skip(!workflowAuthEnabled, 'Run with npm run test:gift-cards against a seeded Supabase project.')

  const runId = process.env.WORKFLOW_TEST_RUN_ID ?? `${Date.now()}`
  const fallbackBusinessSlug = process.env.E2E_BUSINESS_SLUG ?? 'velvet-brew'
  const fundingNote = `gift-card-workflow-funding-${runId}`
  const catalogTitle = `Workflow Gift Card ${runId}`

  let businessId = ''
  let businessName = ''
  let customerProfileId = ''
  let catalogId = ''
  let businessRewardRatePercent = 0
  let customerGiftCardId = ''
  let customerGiftCardCode = ''
  let ownerGiftCardId = ''
  let ownerGiftCardCode = ''
  let ownerGiftCardInitialBalance = 0

  test('GC001 verified customer can browse gift-card catalog after earning points', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const owner = await getProfileByEmail(ownerClient, e2eAccounts.businessOwner)
    const business = owner.businessId
      ? await getBusinessById(ownerClient, owner.businessId)
      : await getBusinessBySlug(ownerClient, fallbackBusinessSlug)
    const customer = await getProfileByEmail(customerClient, e2eAccounts.customer)
    businessId = business.id
    businessName = business.name
    businessRewardRatePercent = business.reward_rate_percent
    customerProfileId = customer.id

    const catalogItem = await createGiftCardCatalogItem(ownerClient, businessId, catalogTitle, 100)
    catalogId = catalogItem.id
    let balance = await getRewardBalance(customerClient, customerProfileId)
    const shortfall = Math.max(0, catalogItem.points_cost - balance.points)
    if (shortfall > 0) {
      expect(business.reward_rate_percent).toBeGreaterThan(0)
      const fundingPurchase = Math.ceil(((shortfall + 1) * 100) / business.reward_rate_percent)
      await recordMemberQrSale(staffClient, customer.memberQrToken!, fundingPurchase, fundingNote)
      balance = await getRewardBalance(customerClient, customerProfileId)
    }
    expect(balance.points).toBeGreaterThanOrEqual(catalogItem.points_cost)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/gift-cards')
    await expect(page.locator('body')).toContainText(/Gift Card Catalog|Available Points|Claimable/i)
  })

  test('GC002 verified customer can issue a gift card and see wallet state', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const issuedCard: Record<string, unknown> = await issueGiftCardForCustomer(
      customerClient,
      catalogId,
      customerProfileId,
    )
    const latestCard = await getLatestGiftCardForCustomer(customerClient, customerProfileId)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    customerGiftCardId = latestCard.id as string
    customerGiftCardCode = latestCard.code as string

    expect(latestCard.id).toBe(issuedCard.id)
    expect(latestCard.status).toBe('active')
    expect(latestCard.points_spent).toBe(100)
    expect(balanceAfter.points).toBe(balanceBefore.points - Number(latestCard.points_spent))

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/wallet/gift-cards')
    await expect(page.locator('body')).toContainText(/Gift Cards|Active|Keep active/i)
  })

  test('GC003 business owner issue button gifts a card without deducting customer points', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/gift-cards')
    await page.getByRole('combobox', { name: 'Gift card', exact: true }).click()
    await page.getByRole('option', { name: new RegExp(catalogTitle, 'i') }).click()
    await page.getByRole('combobox', { name: 'Customer', exact: true }).click()
    await page.getByRole('option', { name: new RegExp(e2eAccounts.customer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).click()
    await page.getByRole('button', { name: 'Issue Card', exact: true }).click()
    await expect(page.getByText('Gift card issued', { exact: true })).toBeVisible()

    const issuedCard = await getLatestGiftCardForCustomer(customerClient, customerProfileId)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    ownerGiftCardId = issuedCard.id as string
    ownerGiftCardCode = issuedCard.code as string
    ownerGiftCardInitialBalance = Number(issuedCard.initial_balance)

    expect(issuedCard.status).toBe('active')
    expect(issuedCard.points_spent).toBe(0)
    expect(ownerGiftCardInitialBalance).toBeGreaterThan(0)
    expect(Number(issuedCard.remaining_balance)).toBe(ownerGiftCardInitialBalance)
    expect(balanceAfter.points).toBe(balanceBefore.points)
  })

  test('GC004 platform admin issue button gifts a card without deducting customer points', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)

    await signInAdmin(page, e2eAccounts.admin)
    await page.goto('/admin/gift-cards')
    await page.getByRole('combobox', { name: 'Business', exact: true }).click()
    await page.getByRole('option', { name: businessName, exact: true }).click()
    await page.getByRole('combobox', { name: 'Gift card', exact: true }).click()
    await page.getByRole('option', { name: new RegExp(catalogTitle, 'i') }).click()
    await page.getByRole('combobox', { name: 'Customer', exact: true }).click()
    await page.getByRole('option', { name: new RegExp(e2eAccounts.customer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).click()
    await page.getByRole('button', { name: 'Issue Card', exact: true }).click()
    await expect(page.getByText('Gift card issued', { exact: true })).toBeVisible()

    const issuedCard = await getLatestGiftCardForCustomer(customerClient, customerProfileId)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)

    expect(issuedCard.status).toBe('active')
    expect(issuedCard.points_spent).toBe(0)
    expect(balanceAfter.points).toBe(balanceBefore.points)
  })

  test('GC005 partial gift-card charge preserves the remaining balance and records the sale ledger', async ({ page }) => {
    expect(ownerGiftCardId).toBeTruthy()
    expect(ownerGiftCardInitialBalance).toBeGreaterThan(2)

    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const receiptNumber = `GC-PARTIAL-${runId}`
    const clientRequestId = crypto.randomUUID()
    const originalBill = 100
    const giftCardAmount = 2

    const updatedCard = await redeemGiftCardForBusiness(staffClient, ownerGiftCardId, businessId, {
      originalBill,
      receiptNumber,
      giftCardAmount,
      clientRequestId,
    })
    const persistedCard = await getGiftCardById(customerClient, ownerGiftCardId)
    const transaction = await getMemberTransactionByReceipt(ownerClient, businessId, receiptNumber)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    const expectedPoints = Math.floor(originalBill * businessRewardRatePercent / 100)

    expect(updatedCard.status).toBe('active')
    expect(Number(updatedCard.remaining_balance)).toBe(ownerGiftCardInitialBalance - giftCardAmount)
    expect(persistedCard.status).toBe('active')
    expect(Number(persistedCard.remaining_balance)).toBe(ownerGiftCardInitialBalance - giftCardAmount)
    expect(transaction.profileId).toBe(customerProfileId)
    expect(transaction.purchaseAmount).toBe(originalBill)
    expect(transaction.pointsAwarded).toBe(expectedPoints)
    expect(transaction.clientRequestId).toBe(clientRequestId)
    expect(transaction.note).toContain(`Gift card code: ${ownerGiftCardCode}.`)
    expect(transaction.note).toContain('Gift card value: 2.00.')
    expect(balanceAfter.points).toBe(balanceBefore.points + expectedPoints)

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/redemptions')
    const transactionRow = page.locator(`[data-transaction-receipt="${receiptNumber}"]`)
    await expect(transactionRow).toBeVisible()
    await expect(transactionRow).toContainText(ownerGiftCardCode)
  })

  test('GC006 final gift-card charge reaches zero, remains in the ledger, and cannot be charged again', async ({ page }) => {
    const remainingAmount = ownerGiftCardInitialBalance - 2
    expect(remainingAmount).toBeGreaterThan(0)

    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const receiptNumber = `GC-FINAL-${runId}`
    const clientRequestId = crypto.randomUUID()
    const originalBill = 100
    const redeemedCard = await redeemGiftCardForBusiness(staffClient, ownerGiftCardId, businessId, {
      originalBill,
      receiptNumber,
      giftCardAmount: remainingAmount,
      clientRequestId,
    })
    const persistedCard = await getGiftCardById(customerClient, ownerGiftCardId)
    const transaction = await getMemberTransactionByReceipt(ownerClient, businessId, receiptNumber)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    const expectedPoints = Math.floor(originalBill * businessRewardRatePercent / 100)

    expect(redeemedCard.status).toBe('redeemed')
    expect(redeemedCard.redeemed_at).toBeTruthy()
    expect(Number(redeemedCard.remaining_balance)).toBe(0)
    expect(persistedCard.status).toBe('redeemed')
    expect(Number(persistedCard.remaining_balance)).toBe(0)
    expect(transaction.profileId).toBe(customerProfileId)
    expect(transaction.pointsAwarded).toBe(expectedPoints)
    expect(transaction.clientRequestId).toBe(clientRequestId)
    expect(balanceAfter.points).toBe(balanceBefore.points + expectedPoints)
    await expect(
      redeemGiftCardForBusiness(staffClient, ownerGiftCardId, businessId),
    ).rejects.toThrow(/no remaining balance|not active/i)

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/redemptions')
    await expect(page.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible()
    const transactionRow = page.locator(`[data-transaction-receipt="${receiptNumber}"]`)
    await expect(transactionRow).toBeVisible()
    await expect(transactionRow).toContainText(/Gift card used|Gift card redeemed/i)

    expect(customerGiftCardId).toBeTruthy()
  })

  test('GC007 customer wallet shows both active and fully redeemed gift-card balances', async ({ page }) => {
    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/wallet/gift-cards')

    await expect(page.getByText(customerGiftCardCode, { exact: true })).toBeVisible()
    await page.getByRole('tab', { name: /redeemed/i }).click()
    await expect(page.getByText(ownerGiftCardCode, { exact: true })).toBeVisible()
  })
})
