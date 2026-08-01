import { expect, test } from '@playwright/test'

import { signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'
import {
  createGiftCardCatalogItem,
  getBusinessById,
  getBusinessBySlug,
  getLatestGiftCardForCustomer,
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
  let customerProfileId = ''
  let catalogId = ''
  let giftCardId = ''

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
    customerProfileId = customer.id

    await recordMemberQrSale(staffClient, customer.memberQrToken!, 95, fundingNote)
    const catalogItem = await createGiftCardCatalogItem(ownerClient, businessId, catalogTitle, 100)
    catalogId = catalogItem.id
    const balance = await getRewardBalance(customerClient, customerProfileId)
    expect(balance.points).toBeGreaterThanOrEqual(catalogItem.points_cost)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/gift-cards')
    await expect(page.locator('body')).toContainText(/Gift Card Catalog|Available Points|Claimable/i)
  })

  test('GC002 verified customer can issue a gift card and see wallet state', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const issuedCard: Record<string, unknown> = await issueGiftCardForCustomer(
      customerClient,
      catalogId,
      customerProfileId,
    )
    const latestCard = await getLatestGiftCardForCustomer(customerClient, customerProfileId)
    giftCardId = latestCard.id as string

    expect(latestCard.id).toBe(issuedCard.id)
    expect(latestCard.status).toBe('active')

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/wallet/gift-cards')
    await expect(page.locator('body')).toContainText(/Gift Cards|Active|Keep active/i)
  })

  test('GC003 business staff can redeem an active gift card once', async ({ page }) => {
    expect(giftCardId).toBeTruthy()

    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    const redeemedCard = await redeemGiftCardForBusiness(staffClient, giftCardId, businessId)

    expect(redeemedCard.status).toBe('redeemed')
    expect(redeemedCard.redeemed_at).toBeTruthy()
    await expect(
      redeemGiftCardForBusiness(staffClient, giftCardId, businessId),
    ).rejects.toThrow(/no remaining balance|not active/i)

    await signInBusinessPortal(page, e2eAccounts.businessStaff)
    await page.goto('/business/redemptions')
    await expect(page.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible()
    await expect(page.locator('body')).toContainText(/Gift card redeemed|Transaction History/i)
  })
})
