import { expect, test, type Browser, type Page } from '@playwright/test'

import { signInAdmin, signInCustomer } from './helpers/auth.js'
import { getProfileByEmail, getSupabaseSessionClient } from './helpers/supabase.js'

const enabled = process.env.E2E_REWARDME_MEMBERSHIP_OPERATIONS_CHECK === 'true'
const memberEmail = process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test'
const adminEmail = process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test'

function monitorUnexpectedErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  return errors
}

async function newMobilePage(browser: Browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  return { context, page: await context.newPage() }
}

test.describe('live RewardMe manual membership operations', () => {
  test.skip(!enabled, 'Enable only for the deliberately published RewardMe QA member and administrator.')

  test('member request, admin approval, and persisted active membership work', async ({ browser }) => {
    test.setTimeout(90_000)
    const firstMemberSession = await newMobilePage(browser)
    const memberErrors = monitorUnexpectedErrors(firstMemberSession.page)

    await signInCustomer(firstMemberSession.page, memberEmail)
    await firstMemberSession.page.goto('/membership')
    await expect(firstMemberSession.page.locator('[data-membership-request-panel]')).toBeVisible()
    await expect(firstMemberSession.page.locator('body')).not.toContainText('Membership details could not be loaded.')

    const activeMembership = firstMemberSession.page.getByText(/Active (?:regular|gold) membership/i).first()
    const pendingReview = firstMemberSession.page.getByText('Review pending', { exact: true }).first()
    const requestNote = firstMemberSession.page.locator('#membership-request-note')
    await expect(activeMembership.or(pendingReview).or(requestNote)).toBeVisible()
    let requiresApproval = false

    if (!(await activeMembership.isVisible())) {
      if (!(await pendingReview.isVisible())) {
        await requestNote.fill('Automated RewardMe live workflow verification.')
        await firstMemberSession.page.getByRole('button', { name: 'Request regular access' }).click()
        await expect(pendingReview).toBeVisible()
      }
      requiresApproval = true
    }

    expect(memberErrors).toEqual([])
    await firstMemberSession.context.close()

    if (requiresApproval) {
      const adminSession = await newMobilePage(browser)
      const adminErrors = monitorUnexpectedErrors(adminSession.page)
      await signInAdmin(adminSession.page, adminEmail)
      await adminSession.page.goto('/admin/memberships')
      await expect(adminSession.page.locator('[data-membership-operations]')).toBeVisible()
      await expect(adminSession.page.locator('body')).not.toContainText('Operations data could not be loaded.')

      const request = adminSession.page.locator('article').filter({ hasText: memberEmail }).first()
      await expect(request).toBeVisible()
      await request.getByRole('button', { name: 'Approve' }).click()
      const dialog = adminSession.page.getByRole('dialog')
      await dialog.getByLabel('Operations note').fill('Approved by automated RewardMe live workflow verification.')
      await dialog.getByRole('button', { name: 'Confirm action' }).click()
      await expect(adminSession.page.getByText('Membership operation recorded in the audit history.')).toBeVisible()

      expect(adminErrors).toEqual([])
      await adminSession.context.close()
    }

    const finalMemberSession = await newMobilePage(browser)
    const finalMemberErrors = monitorUnexpectedErrors(finalMemberSession.page)
    await signInCustomer(finalMemberSession.page, memberEmail)
    await finalMemberSession.page.goto('/membership')
    await expect(finalMemberSession.page.getByText(/Active (?:regular|gold) membership/i)).toBeVisible()
    await expect(finalMemberSession.page.locator('body')).not.toContainText('Membership details could not be loaded.')
    expect(finalMemberErrors).toEqual([])
    await finalMemberSession.context.close()

    const memberClient = await getSupabaseSessionClient(memberEmail)
    const profile = await getProfileByEmail(memberClient, memberEmail)
    const { data: program, error: programError } = await memberClient
      .from('programs')
      .select('id')
      .eq('slug', 'pinas')
      .single()
    if (programError || !program) throw new Error(`RewardMe program could not be loaded: ${programError?.message ?? 'missing row'}`)

    const { data: membership, error: membershipError } = await memberClient
      .from('memberships')
      .select('id, status, tier, provider, provider_status, current_period_end')
      .eq('program_id', program.id)
      .eq('profile_id', profile.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .single()
    if (membershipError || !membership) {
      throw new Error(`Active RewardMe membership was not persisted: ${membershipError?.message ?? 'missing row'}`)
    }

    expect(membership.provider).toBe('manual')
    expect(membership.provider_status).toBe('active')
    expect(['regular', 'gold']).toContain(membership.tier)
  })
})
