import { expect, test, type Page, type Response } from '@playwright/test'

import { signInAdmin, signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'
import {
  assertExpectedQaAccount,
  assertExpectedQaCommerceContext,
  assertExpectedQaOwnerBusinessContext,
  createGiftCardCatalogItem,
  deactivateGiftCardCatalogItem,
  getBusinessById,
  getBusinessBySlug,
  getGiftCardById,
  getMemberTransactionByReceipt,
  getProfileByEmail,
  getRewardBalance,
  getSupabaseSessionClient,
  recordMemberQrSale,
  redeemGiftCardForBusinessViaRpc,
} from './helpers/supabase.js'

function isRpcResponse(response: Response, functionName: string) {
  return response.request().method() === 'POST'
    && new URL(response.url()).pathname.endsWith(`/rest/v1/rpc/${functionName}`)
}

async function readSuccessfulRpc(response: Response) {
  const responseText = await response.text()
  expect(response.ok(), `${response.request().method()} ${response.url()} returned ${response.status()}: ${responseText}`).toBeTruthy()

  const responseBody = JSON.parse(responseText) as Record<string, unknown> | Record<string, unknown>[]
  const row = (Array.isArray(responseBody) ? responseBody[0] : responseBody) ?? null
  const requestBody = response.request().postDataJSON() as Record<string, unknown>

  if (!row || typeof row.id !== 'string') {
    throw new Error(`RPC ${response.url()} returned no identifiable row: ${responseText}`)
  }

  return { requestBody, row }
}

function getGiftCardTile(page: Page, title: string) {
  return page.locator('.luxe-card').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  }).first()
}

async function prepareGiftCardSale(
  page: Page,
  input: { code: string; originalBill: number; receiptNumber: string },
) {
  await page.locator('#original-bill').fill(`${input.originalBill}`)
  await page.locator('#gift-card-receipt-number').fill(input.receiptNumber)
  await page.locator('#gift-card-code').fill(input.code)
  await page.getByRole('button', { name: /Validate Gift Card|Validar tarjeta/i }).click()

  const redeemButton = page.getByRole('button', {
    name: /Redeem Gift Card and Complete Sale|Canjear tarjeta/i,
  })
  await expect(redeemButton).toBeEnabled()
  return redeemButton
}

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

  test.afterAll(async () => {
    if (!businessId) return

    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const [owner, business] = await Promise.all([
      getProfileByEmail(ownerClient, e2eAccounts.businessOwner),
      getBusinessById(ownerClient, businessId),
    ])
    assertExpectedQaOwnerBusinessContext({
      business,
      expectedBusinessSlug: fallbackBusinessSlug,
      owner,
      expectedOwnerEmail: e2eAccounts.businessOwner,
    })

    const deactivatedCatalog = await deactivateGiftCardCatalogItem(
      ownerClient,
      businessId,
      catalogId || null,
      catalogTitle,
    )
    expect(deactivatedCatalog.is_active).toBe(false)
  })

  test('GC001 verified customer can browse gift-card catalog after earning points', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const [owner, staff, customer, business] = await Promise.all([
      getProfileByEmail(ownerClient, e2eAccounts.businessOwner),
      getProfileByEmail(staffClient, e2eAccounts.businessStaff),
      getProfileByEmail(customerClient, e2eAccounts.customer),
      getBusinessBySlug(ownerClient, fallbackBusinessSlug),
    ])
    assertExpectedQaCommerceContext({
      business,
      expectedBusinessSlug: fallbackBusinessSlug,
      owner,
      expectedOwnerEmail: e2eAccounts.businessOwner,
      staff,
      expectedStaffEmail: e2eAccounts.businessStaff,
      customer,
      expectedCustomerEmail: e2eAccounts.customer,
    })
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

    const replayRequestId = crypto.randomUUID()
    const replayReceiptNumber = `QR-REPLAY-${runId}`
    const replayNote = `qr-idempotency-${runId}`
    const replayPurchaseAmount = 12.34
    const replayBalanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const firstTransaction = await recordMemberQrSale(
      staffClient,
      customer.memberQrToken!,
      replayPurchaseAmount,
      replayNote,
      { receiptNumber: replayReceiptNumber, clientRequestId: replayRequestId },
    )
    const replayBalanceAfterFirst = await getRewardBalance(customerClient, customerProfileId)
    const replayedTransaction = await recordMemberQrSale(
      staffClient,
      customer.memberQrToken!,
      replayPurchaseAmount,
      replayNote,
      { receiptNumber: replayReceiptNumber, clientRequestId: replayRequestId },
    )
    const replayBalanceAfterRetry = await getRewardBalance(customerClient, customerProfileId)

    expect(replayedTransaction.id).toBe(firstTransaction.id)
    expect(replayBalanceAfterFirst.points).toBeGreaterThanOrEqual(replayBalanceBefore.points)
    expect(replayBalanceAfterRetry.points).toBe(replayBalanceAfterFirst.points)
    await expect(
      recordMemberQrSale(
        staffClient,
        customer.memberQrToken!,
        replayPurchaseAmount + 1,
        replayNote,
        { receiptNumber: replayReceiptNumber, clientRequestId: replayRequestId },
      ),
    ).rejects.toThrow(/already used for a different transaction/i)
    await expect(
      recordMemberQrSale(
        staffClient,
        customer.memberQrToken!,
        replayPurchaseAmount,
        replayNote,
        { receiptNumber: `${replayReceiptNumber}-CHANGED`, clientRequestId: replayRequestId },
      ),
    ).rejects.toThrow(/already used for a different transaction/i)
    await expect(
      recordMemberQrSale(
        staffClient,
        customer.memberQrToken!,
        replayPurchaseAmount,
        `${replayNote}-changed`,
        { receiptNumber: replayReceiptNumber, clientRequestId: replayRequestId },
      ),
    ).rejects.toThrow(/already used for a different transaction/i)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/gift-cards')
    await expect(page.locator('body')).toContainText(/Gift Card Catalog|Available Points|Claimable/i)
  })

  test('GC002 verified customer can issue a gift card and see wallet state', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/gift-cards')
    const catalogCard = getGiftCardTile(page, catalogTitle)
    await expect(catalogCard).toBeVisible()
    await catalogCard.getByRole('button', { name: /^Issue$/i }).click()
    await expect(page.getByRole('dialog')).toContainText(catalogTitle)

    const rpcResponsePromise = page.waitForResponse((response) => isRpcResponse(response, 'issue_gift_card'))
    await page.getByRole('dialog').getByRole('button', { name: /^Confirm$/i }).click()
    const { requestBody, row: issuedRow } = await readSuccessfulRpc(await rpcResponsePromise)

    expect(requestBody.p_catalog_id).toBe(catalogId)
    expect(requestBody.p_customer_id).toBe(customerProfileId)
    await expect(page).toHaveURL(new RegExp(`/wallet/gift-cards/${issuedRow.id}$`))

    const issuedCard = await getGiftCardById(customerClient, issuedRow.id as string)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    customerGiftCardId = issuedCard.id as string
    customerGiftCardCode = issuedCard.code as string

    expect(issuedCard.status).toBe('active')
    expect(issuedCard.catalog_id).toBe(catalogId)
    expect(issuedCard.customer_id).toBe(customerProfileId)
    expect(issuedCard.points_spent).toBe(100)
    expect(balanceAfter.points).toBe(balanceBefore.points - Number(issuedCard.points_spent))

    await page.goto('/wallet/gift-cards')
    await expect(page.locator('body')).toContainText(/Gift Cards|Active|Keep active/i)
    await expect(page.getByText(customerGiftCardCode, { exact: true })).toBeVisible()
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
    const rpcResponsePromise = page.waitForResponse((response) => isRpcResponse(response, 'issue_gift_card'))
    await page.getByRole('button', { name: 'Issue Card', exact: true }).click()
    await expect(page.getByText('Gift card issued', { exact: true })).toBeVisible()

    const { requestBody, row: issuedRow } = await readSuccessfulRpc(await rpcResponsePromise)
    expect(requestBody.p_catalog_id).toBe(catalogId)
    expect(requestBody.p_customer_id).toBe(customerProfileId)
    const issuedCard = await getGiftCardById(customerClient, issuedRow.id as string)
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
    const adminClient = await getSupabaseSessionClient(e2eAccounts.admin)
    const admin = await getProfileByEmail(adminClient, e2eAccounts.admin)
    assertExpectedQaAccount(admin, e2eAccounts.admin, 'platform admin')
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)

    await signInAdmin(page, e2eAccounts.admin)
    await page.goto('/admin/gift-cards')
    await page.getByRole('combobox', { name: 'Business', exact: true }).click()
    await page.getByRole('option', { name: businessName, exact: true }).click()
    await page.getByRole('combobox', { name: 'Gift card', exact: true }).click()
    await page.getByRole('option', { name: new RegExp(catalogTitle, 'i') }).click()
    await page.getByRole('combobox', { name: 'Customer', exact: true }).click()
    await page.getByRole('option', { name: new RegExp(e2eAccounts.customer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).click()
    const rpcResponsePromise = page.waitForResponse((response) => isRpcResponse(response, 'issue_gift_card'))
    await page.getByRole('button', { name: 'Issue Card', exact: true }).click()
    await expect(page.getByText('Gift card issued', { exact: true })).toBeVisible()

    const { requestBody, row: issuedRow } = await readSuccessfulRpc(await rpcResponsePromise)
    expect(requestBody.p_catalog_id).toBe(catalogId)
    expect(requestBody.p_customer_id).toBe(customerProfileId)
    const issuedCard = await getGiftCardById(customerClient, issuedRow.id as string)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)

    expect(issuedCard.status).toBe('active')
    expect(issuedCard.points_spent).toBe(0)
    expect(balanceAfter.points).toBe(balanceBefore.points)
  })

  test('GC005 partial gift-card charge preserves the remaining balance and records the sale ledger', async ({ page }) => {
    expect(ownerGiftCardId).toBeTruthy()
    expect(ownerGiftCardInitialBalance).toBeGreaterThan(2)

    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const receiptNumber = `GC-PARTIAL-${runId}`
    const originalBill = 2

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/redemptions')
    const redeemButton = await prepareGiftCardSale(page, {
      code: ownerGiftCardCode,
      originalBill,
      receiptNumber,
    })
    await redeemButton.click()
    await expect(page.getByRole('dialog')).toContainText(/Charge gift card/i)

    const rpcResponsePromise = page.waitForResponse((response) => isRpcResponse(response, 'redeem_gift_card'))
    await page.getByRole('dialog').getByRole('button', { name: /Charge Card/i }).click()
    const { requestBody } = await readSuccessfulRpc(await rpcResponsePromise)
    await expect(page.getByText(/Transaction complete/i)).toBeVisible()

    expect(requestBody.p_gift_card_id).toBe(ownerGiftCardId)
    expect(requestBody.p_business_id).toBe(businessId)
    expect(requestBody.p_original_bill).toBe(originalBill)
    expect(requestBody.p_receipt_number).toBe(receiptNumber)
    expect(requestBody.p_client_request_id).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
    const giftCardAmount = Number(requestBody.p_gift_card_amount)
    expect(giftCardAmount).toBeGreaterThan(0)
    expect(giftCardAmount).toBeLessThan(ownerGiftCardInitialBalance)

    const persistedCard = await getGiftCardById(customerClient, ownerGiftCardId)
    const transaction = await getMemberTransactionByReceipt(ownerClient, businessId, receiptNumber)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    const expectedPoints = Math.floor(originalBill * businessRewardRatePercent / 100)

    expect(persistedCard.status).toBe('active')
    expect(Number(persistedCard.remaining_balance)).toBeCloseTo(ownerGiftCardInitialBalance - giftCardAmount, 2)
    expect(transaction.profileId).toBe(customerProfileId)
    expect(transaction.purchaseAmount).toBe(originalBill)
    expect(transaction.pointsAwarded).toBe(expectedPoints)
    expect(transaction.clientRequestId).toBe(requestBody.p_client_request_id)
    expect(transaction.note).toContain(`Gift card code: ${ownerGiftCardCode}.`)
    expect(transaction.note).toContain(`Gift card value: ${giftCardAmount.toFixed(2)}.`)
    expect(balanceAfter.points).toBe(balanceBefore.points + expectedPoints)

    const transactionRow = page.locator(`[data-transaction-receipt="${receiptNumber}"]`)
    await expect(transactionRow).toBeVisible()
    await expect(transactionRow).toContainText(ownerGiftCardCode)
  })

  test('GC006 final gift-card charge reaches zero, remains in the ledger, and cannot be charged again', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const beforeCard = await getGiftCardById(customerClient, ownerGiftCardId)
    const remainingAmount = Number(beforeCard.remaining_balance)
    expect(remainingAmount).toBeGreaterThan(0)

    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const receiptNumber = `GC-FINAL-${runId}`
    const originalBill = Math.max(100, remainingAmount * 2)

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/redemptions')
    const redeemButton = await prepareGiftCardSale(page, {
      code: ownerGiftCardCode,
      originalBill,
      receiptNumber,
    })
    await redeemButton.click()

    const rpcResponsePromise = page.waitForResponse((response) => isRpcResponse(response, 'redeem_gift_card'))
    await page.getByRole('dialog').getByRole('button', { name: /Charge Card/i }).click()
    const { requestBody, row: uiRedeemedCard } = await readSuccessfulRpc(await rpcResponsePromise)
    await expect(page.getByText(/Transaction complete/i)).toBeVisible()

    expect(requestBody.p_gift_card_id).toBe(ownerGiftCardId)
    expect(requestBody.p_business_id).toBe(businessId)
    expect(requestBody.p_original_bill).toBe(originalBill)
    expect(requestBody.p_receipt_number).toBe(receiptNumber)
    expect(requestBody.p_client_request_id).toEqual(expect.stringMatching(/^[0-9a-f-]{36}$/i))
    expect(Number(requestBody.p_gift_card_amount)).toBeCloseTo(remainingAmount, 2)
    expect(uiRedeemedCard.id).toBe(ownerGiftCardId)

    const replayPayload = {
      originalBill: Number(requestBody.p_original_bill),
      receiptNumber: String(requestBody.p_receipt_number),
      giftCardAmount: Number(requestBody.p_gift_card_amount),
      clientRequestId: String(requestBody.p_client_request_id),
    }

    const persistedCard = await getGiftCardById(customerClient, ownerGiftCardId)
    const transaction = await getMemberTransactionByReceipt(ownerClient, businessId, receiptNumber)
    const balanceAfterUiCharge = await getRewardBalance(customerClient, customerProfileId)
    const expectedPoints = Math.floor(originalBill * businessRewardRatePercent / 100)

    expect(persistedCard.status).toBe('redeemed')
    expect(persistedCard.redeemed_at).toBeTruthy()
    expect(Number(persistedCard.remaining_balance)).toBe(0)
    expect(transaction.profileId).toBe(customerProfileId)
    expect(transaction.pointsAwarded).toBe(expectedPoints)
    expect(transaction.clientRequestId).toBe(requestBody.p_client_request_id)
    expect(balanceAfterUiCharge.points).toBe(balanceBefore.points + expectedPoints)

    const [firstReplay, concurrentReplay] = await Promise.all([
      redeemGiftCardForBusinessViaRpc(ownerClient, ownerGiftCardId, businessId, replayPayload),
      redeemGiftCardForBusinessViaRpc(ownerClient, ownerGiftCardId, businessId, replayPayload),
    ])
    const cardAfterReplays = await getGiftCardById(customerClient, ownerGiftCardId)
    const transactionAfterReplays = await getMemberTransactionByReceipt(ownerClient, businessId, receiptNumber)
    const balanceAfterReplays = await getRewardBalance(customerClient, customerProfileId)

    expect(firstReplay.id).toBe(ownerGiftCardId)
    expect(concurrentReplay.id).toBe(ownerGiftCardId)
    expect(Number(firstReplay.remaining_balance)).toBe(0)
    expect(Number(concurrentReplay.remaining_balance)).toBe(0)
    expect(cardAfterReplays.status).toBe('redeemed')
    expect(Number(cardAfterReplays.remaining_balance)).toBe(0)
    expect(transactionAfterReplays.id).toBe(transaction.id)
    expect(transactionAfterReplays.clientRequestId).toBe(replayPayload.clientRequestId)
    expect(balanceAfterReplays.points).toBe(balanceAfterUiCharge.points)

    await expect(
      redeemGiftCardForBusinessViaRpc(ownerClient, ownerGiftCardId, businessId, {
        ...replayPayload,
        originalBill: replayPayload.originalBill + 1,
      }),
    ).rejects.toThrow(/different transaction/i)
    await expect(
      redeemGiftCardForBusinessViaRpc(ownerClient, ownerGiftCardId, businessId, {
        ...replayPayload,
        giftCardAmount: null,
      }),
    ).rejects.toThrow(/different transaction/i)

    await expect(page.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible()
    const transactionRow = page.locator(`[data-transaction-receipt="${receiptNumber}"]`)
    await expect(transactionRow).toBeVisible()
    await expect(transactionRow).toContainText(/Gift card used|Gift card redeemed/i)

    await page.getByRole('button', { name: /New Transaction/i }).click()
    await page.locator('#original-bill').fill('10')
    await page.locator('#gift-card-receipt-number').fill(`GC-SPENT-${runId}`)
    await page.locator('#gift-card-code').fill(ownerGiftCardCode)
    await page.getByRole('button', { name: /Validate Gift Card/i }).click()
    await expect(page.getByText(/already been redeemed/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Redeem Gift Card and Complete Sale/i })).toBeDisabled()

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
