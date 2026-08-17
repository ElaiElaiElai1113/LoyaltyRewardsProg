import { expect, test } from '@playwright/test'

import { signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'
import {
  ensureActiveMembership,
  fulfillRewardRedemption,
  getBusinessById,
  getFirstRewardForBusiness,
  getLatestRedemptionForCustomer,
  getProfileByEmail,
  getRewardById,
  getRewardBalance,
  getSupabaseSessionClient,
  recordMemberQrSale,
  redeemRewardForCustomer,
} from './helpers/supabase.js'

test.describe.serial('reward redemption and fulfillment workflow automation', () => {
  test.skip(!workflowAuthEnabled, 'Run with npm run test:rewards against a seeded Supabase project.')

  const runId = process.env.WORKFLOW_TEST_RUN_ID ?? `${Date.now()}`
  const fundingNote = `reward-workflow-funding-${runId}`
  const redemptionNote = `reward-workflow-redemption-${runId}`

  let businessId = ''
  let customerProfileId = ''
  let redemptionId = ''

  test('RW001 verified customer can browse rewards after earning enough points', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const staffClient = await getSupabaseSessionClient(e2eAccounts.businessStaff)
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)
    const owner = await getProfileByEmail(ownerClient, e2eAccounts.businessOwner)
    expect(owner.businessId).toBeTruthy()
    const business = await getBusinessById(ownerClient, owner.businessId!)
    const customer = await getProfileByEmail(customerClient, e2eAccounts.customer)
    businessId = business.id
    customerProfileId = customer.id

    await ensureActiveMembership(customerClient, business.program_id)
    const reward = await getFirstRewardForBusiness(customerClient, businessId)
    let balance = await getRewardBalance(customerClient, customerProfileId)
    const shortfall = Math.max(0, reward.points_cost - balance.points)
    if (shortfall > 0) {
      expect(business.reward_rate_percent).toBeGreaterThan(0)
      const fundingPurchase = Math.ceil(((shortfall + 1) * 100) / business.reward_rate_percent)
      await recordMemberQrSale(staffClient, customer.memberQrToken!, fundingPurchase, fundingNote)
      balance = await getRewardBalance(customerClient, customerProfileId)
    }
    expect(balance.points).toBeGreaterThanOrEqual(reward.points_cost)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/rewards')
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.locator('body')).toContainText(/QR de miembro|member QR|Billetera de recompensas/i)
    await expect(page.locator('body')).toContainText(/Puntos totales|Total Points/i)
  })

  test('RW002 verified customer can redeem a reward and see activity', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const reward = await getFirstRewardForBusiness(customerClient, businessId)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const requestId = crypto.randomUUID()
    const redeemed = await redeemRewardForCustomer(customerClient, reward.id, redemptionNote, requestId)
    const replayed = await redeemRewardForCustomer(customerClient, reward.id, redemptionNote, requestId)
    await expect(
      redeemRewardForCustomer(customerClient, reward.id, `${redemptionNote}-different`, requestId),
    ).rejects.toThrow(/different reward redemption/i)
    const latestRedemption = await getLatestRedemptionForCustomer(customerClient, customerProfileId)
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    const rewardAfter = await getRewardById(customerClient, reward.id)
    redemptionId = latestRedemption.id as string

    expect(latestRedemption.id).toBe(redeemed.id)
    expect(replayed.id).toBe(redeemed.id)
    expect(latestRedemption.status).toBe('ready')
    expect(balanceAfter.points).toBe(balanceBefore.points - reward.points_cost)
    expect(rewardAfter.inventory).toBe(reward.inventory - 1)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/activity')
    await expect(page.locator('body')).toContainText(/Redeemed|Rewards redeemed|Activity/i)
  })

  test('RW003 business can see and fulfill the reward redemption', async ({ page }) => {
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)

    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    await page.goto('/business/dashboard')
    await expect(page.locator('body')).toContainText(/Fulfillment Queue|Cola de cumplimiento/i)
    await expect(page.locator('body')).toContainText(/Pending Fulfillment|Cumplimiento pendiente/i)

    await fulfillRewardRedemption(ownerClient, redemptionId)
    const fulfilledRedemption = await getLatestRedemptionForCustomer(ownerClient, customerProfileId)
    expect(fulfilledRedemption.status).toBe('fulfilled')
  })
})
