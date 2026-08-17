import { expect, test, type Response } from '@playwright/test'

import { signInBusinessPortal, signInCustomer } from './helpers/auth.js'
import { e2eAccounts, workflowAuthEnabled } from './helpers/env.js'
import {
  assertExpectedQaCommerceContext,
  assertExpectedQaOwnerBusinessContext,
  ensureActiveMembership,
  getBusinessById,
  getBusinessBySlug,
  getProfileByEmail,
  getRewardById,
  getRewardBalance,
  getRewardForBusinessByTitle,
  getRewardRedemptionByRequestId,
  getSupabaseSessionClient,
  recordMemberQrSale,
  redeemRewardForCustomerViaRpc,
  restoreRewardInventoryIfUnchanged,
} from './helpers/supabase.js'

function isExactRedemptionUpdate(response: Response, redemptionId: string) {
  const url = new URL(response.url())
  return response.request().method() === 'PATCH'
    && url.pathname.endsWith('/rest/v1/redemptions')
    && url.searchParams.get('id') === `eq.${redemptionId}`
}

function isBusinessRedemptionsRead(response: Response) {
  const url = new URL(response.url())
  return response.request().method() === 'GET'
    && url.pathname.endsWith('/rest/v1/redemptions')
    && (url.searchParams.get('select') ?? '').includes('rewards!inner')
}

test.describe.serial('reward redemption and fulfillment workflow automation', () => {
  test.skip(!workflowAuthEnabled, 'Run with npm run test:rewards against a seeded Supabase project.')

  const runId = process.env.WORKFLOW_TEST_RUN_ID ?? `${Date.now()}`
  const fallbackBusinessSlug = process.env.E2E_BUSINESS_SLUG ?? 'velvet-brew'
  const expectedRewardName = process.env.E2E_REWARD_NAME ?? 'Butter Croissant Pairing'
  const fundingNote = `reward-workflow-funding-${runId}`
  const redemptionNote = `reward-workflow-redemption-${runId}`

  let businessId = ''
  let customerProfileId = ''
  let rewardId = ''
  let rewardTitle = ''
  let rewardInitialInventory: number | null = null
  let redemptionId = ''
  let redemptionRequestId = ''

  test.afterAll(async () => {
    if (!rewardId || !businessId || rewardInitialInventory === null) return

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

    const restoredReward = await restoreRewardInventoryIfUnchanged(ownerClient, {
      rewardId,
      businessId,
      expectedTitle: expectedRewardName,
      expectedCurrentInventory: rewardInitialInventory - 1,
      originalInventory: rewardInitialInventory,
    })
    expect(restoredReward.inventory).toBe(rewardInitialInventory)
  })

  test('RW001 customer reward routes remain intentionally hidden after the backend fixture is funded', async ({ page }) => {
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
    customerProfileId = customer.id

    const reward = await getRewardForBusinessByTitle(customerClient, businessId, expectedRewardName)
    expect(reward.inventory).toBeGreaterThan(0)
    rewardId = reward.id
    rewardTitle = reward.title
    rewardInitialInventory = reward.inventory

    await ensureActiveMembership(customerClient, business.program_id)
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
    await page.goto(`/redeem/${reward.id}`)
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('button', { name: /Redeem Now/i })).toHaveCount(0)
  })

  test('RW002 backend reward-redemption contract remains retry-safe while customer reward UI is hidden', async ({ page }) => {
    const customerClient = await getSupabaseSessionClient(e2eAccounts.customer)
    const reward = await getRewardById(customerClient, rewardId)
    const balanceBefore = await getRewardBalance(customerClient, customerProfileId)
    const requestId = crypto.randomUUID()
    const redeemed = await redeemRewardForCustomerViaRpc(customerClient, reward.id, redemptionNote, requestId)
    const replayed = await redeemRewardForCustomerViaRpc(customerClient, reward.id, redemptionNote, requestId)
    await expect(
      redeemRewardForCustomerViaRpc(customerClient, reward.id, `${redemptionNote}-different`, requestId),
    ).rejects.toThrow(/different reward redemption/i)
    const persistedRedemption = await getRewardRedemptionByRequestId(
      customerClient,
      customerProfileId,
      reward.id,
      requestId,
    )
    const balanceAfter = await getRewardBalance(customerClient, customerProfileId)
    const rewardAfter = await getRewardById(customerClient, reward.id)
    redemptionId = persistedRedemption.id as string
    redemptionRequestId = requestId

    expect(persistedRedemption.id).toBe(redeemed.id)
    expect(replayed.id).toBe(redeemed.id)
    expect(persistedRedemption.reward_id).toBe(reward.id)
    expect(persistedRedemption.notes).toBe(redemptionNote)
    expect(persistedRedemption.client_request_id).toBe(requestId)
    expect(persistedRedemption.status).toBe('ready')
    expect(balanceAfter.points).toBe(balanceBefore.points - reward.points_cost)
    expect(rewardAfter.inventory).toBe(reward.inventory - 1)

    await signInCustomer(page, e2eAccounts.customer)
    await page.goto('/activity')
    await expect(page.locator('body')).toContainText(/Redeemed|Rewards redeemed|Activity/i)
  })

  test('RW003 business can see and fulfill the reward redemption', async ({ page }) => {
    const ownerClient = await getSupabaseSessionClient(e2eAccounts.businessOwner)

    const queueDataResponsePromise = page.waitForResponse(isBusinessRedemptionsRead)
    await signInBusinessPortal(page, e2eAccounts.businessOwner)
    const queueDataResponse = await queueDataResponsePromise
    const queueDataText = await queueDataResponse.text()
    expect(
      queueDataResponse.ok(),
      `GET ${queueDataResponse.url()} returned ${queueDataResponse.status()}: ${queueDataText}`,
    ).toBeTruthy()
    const queueData = JSON.parse(queueDataText) as Array<{ id: string }>
    const exactQueueIndex = queueData.findIndex((redemption) => redemption.id === redemptionId)
    expect(exactQueueIndex, 'The exact QA redemption must be present on the first fulfillment page.').toBeGreaterThanOrEqual(0)
    expect(exactQueueIndex, 'The exact QA redemption must be present on the first fulfillment page.').toBeLessThan(5)

    await expect(page.locator('body')).toContainText(/Fulfillment Queue|Cola de cumplimiento/i)
    await expect(page.locator('body')).toContainText(/Pending Fulfillment|Cumplimiento pendiente/i)

    const queue = page.getByRole('list', { name: /Fulfillment Queue|Cola de cumplimiento/i })
    const redemptionRow = queue.getByRole('listitem').nth(exactQueueIndex)
    await expect(redemptionRow).toBeVisible()
    await expect(redemptionRow.getByRole('heading')).toHaveText(rewardTitle)

    await page.route('**/rest/v1/redemptions*', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const attemptedId = url.searchParams.get('id')
      if (request.method() === 'PATCH' && attemptedId !== `eq.${redemptionId}`) {
        await route.abort('blockedbyclient')
        return
      }
      await route.continue()
    })

    const anyUpdateRequestPromise = page.waitForRequest((request) => (
      request.method() === 'PATCH'
      && new URL(request.url()).pathname.endsWith('/rest/v1/redemptions')
    ))
    const updateResponsePromise = page.waitForResponse((response) => (
      isExactRedemptionUpdate(response, redemptionId)
    ))
    await redemptionRow.getByRole('button', { name: /Fulfill|Completar/i }).click()
    const updateRequest = await anyUpdateRequestPromise
    expect(new URL(updateRequest.url()).searchParams.get('id')).toBe(`eq.${redemptionId}`)
    const updateResponse = await updateResponsePromise
    const updateResponseText = await updateResponse.text()
    expect(
      updateResponse.ok(),
      `PATCH ${updateResponse.url()} returned ${updateResponse.status()}: ${updateResponseText}`,
    ).toBeTruthy()
    await expect(page.getByText(/Redemption fulfilled successfully/i)).toBeVisible()

    const fulfilledRedemption = await getRewardRedemptionByRequestId(
      ownerClient,
      customerProfileId,
      rewardId,
      redemptionRequestId,
    )
    expect(fulfilledRedemption.id).toBe(redemptionId)
    expect(fulfilledRedemption.status).toBe('fulfilled')
    await expect(redemptionRow).toContainText(/Fulfilled|Completado/i)
  })
})
