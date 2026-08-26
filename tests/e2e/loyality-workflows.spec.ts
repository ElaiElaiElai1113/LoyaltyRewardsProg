import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { expect, test, type Page } from '@playwright/test'

import { e2ePassword } from './helpers/env.js'

const enabled = process.env.LOYALITY_PRODUCTION_WORKFLOW_ENABLED === 'true'
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

type FixtureIds = {
  programId: string
  businessId: string
  customerId: string
  customerToken: string
  offerId: string
  offerToken: string
  visitRuleId: string
  catalogId: string
  raffleId: string
  originalPoints: number
  originalPhone: string
}

const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const label = `QA Full Workflow ${stamp}`
const receipt = `LOYALITY-QA-${stamp}`
let admin: SupabaseClient
let fixture: FixtureIds
let transactionId: string | null = null

function runtimeErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(message.text())
  })
  return errors
}

async function signIn(page: Page, email: string, destination: RegExp) {
  await page.goto('/signin')
  await page.getByLabel('Email address').fill(email)
  await page.locator('#loyality-password').fill(e2ePassword)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page).toHaveURL(destination)
}

// The production-only tables are intentionally absent from the generated browser schema.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QaRow = Record<string, any>

async function requiredSingle(query: PromiseLike<{ data: unknown; error: { message: string } | null }>, message: string): Promise<QaRow> {
  const { data, error } = await query
  if (error || !data) throw new Error(`${message}: ${error?.message ?? 'record not found'}`)
  return data as QaRow
}

test.describe('Loyality production customer and business workflows', () => {
  test.describe.configure({ mode: 'serial' })
  test.skip(!enabled || !supabaseUrl || !serviceRoleKey, 'Private production workflow credentials are required.')

  test.beforeAll(async () => {
    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const program = await requiredSingle(
      admin.from('programs').select('id').eq('slug', 'loyality').single(),
      'Could not load Loyality',
    )
    const business = await requiredSingle(
      admin.from('businesses').select('id').eq('program_id', program.id).eq('slug', 'loyality-demo-business').single(),
      'Could not load the Loyality QA business',
    )
    const customer = await requiredSingle(
      admin.from('profiles').select('id,member_qr_token,phone').eq('email', 'customer@loyality.test').single(),
      'Could not load the Loyality QA customer',
    )
    if (!customer.member_qr_token) throw new Error('The Loyality QA customer does not have a member QR token.')
    if (!String(customer.phone ?? '').trim()) {
      await requiredSingle(
        admin.from('profiles').update({ phone: '+15550100000' }).eq('id', customer.id).select('id').single(),
        'Could not prepare the Loyality QA customer contact number',
      )
    }

    const balance = await requiredSingle(
      admin.from('reward_balances').select('points').eq('program_id', program.id).eq('profile_id', customer.id).single(),
      'Could not load the Loyality QA balance',
    )
    const { count: visitCount, error: visitCountError } = await admin
      .from('loyality_visits')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('customer_id', customer.id)
    if (visitCountError) throw visitCountError

    const startsAt = new Date(Date.now() - 60_000).toISOString()
    const endsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const offer = await requiredSingle(
      admin.from('loyality_offers').insert({
        program_id: program.id, business_id: business.id, title: `${label} Offer`,
        description: 'Private automated production test offer.', source_label: 'qa-full-workflow',
        reward_title: `${label} Offer Voucher`, reward_kind: 'item',
        reward_description: 'Private automated production test voucher.', starts_at: startsAt,
        ends_at: endsAt, active: true,
      }).select('id,public_token').single(),
      'Could not create the QA offer',
    )
    const visitRule = await requiredSingle(
      admin.from('loyality_visit_rules').insert({
        program_id: program.id, business_id: business.id, name: `${label} Visit Rule`,
        trigger_visit_count: (visitCount ?? 0) + 1, repeat_every: null,
        reward_title: `${label} Visit Voucher`, reward_kind: 'item',
        reward_description: 'Private automated visit reward.', active: true,
      }).select('id').single(),
      'Could not create the QA visit rule',
    )
    const catalog = await requiredSingle(
      admin.from('loyality_voucher_catalog').insert({
        program_id: program.id, business_id: business.id, title: `${label} Catalog Voucher`,
        description: 'Private automated catalog redemption test.', voucher_kind: 'item',
        points_cost: 0, active: true,
      }).select('id').single(),
      'Could not create the QA catalog item',
    )
    const raffle = await requiredSingle(
      admin.from('loyality_raffles').insert({
        program_id: program.id, business_id: business.id, title: `${label} Raffle`,
        prize_description: 'Private automated raffle entry test.', minimum_purchase: 0,
        entries_per_purchase: 1, starts_at: startsAt, ends_at: endsAt, status: 'active',
      }).select('id').single(),
      'Could not create the QA raffle',
    )

    fixture = {
      programId: program.id, businessId: business.id, customerId: customer.id,
      customerToken: customer.member_qr_token, offerId: offer.id, offerToken: offer.public_token,
      visitRuleId: visitRule.id, catalogId: catalog.id, raffleId: raffle.id,
      originalPoints: Number(balance.points ?? 0),
      originalPhone: String(customer.phone ?? ''),
    }
  })

  test.afterAll(async () => {
    if (!admin || !fixture) return
    const cleanupErrors: string[] = []
    async function remove(query: PromiseLike<{ error: { message: string } | null }>, name: string) {
      const { error } = await query
      if (error) cleanupErrors.push(`${name}: ${error.message}`)
    }

    await remove(admin.from('loyality_vouchers').delete().eq('customer_id', fixture.customerId).like('title', `${label}%`), 'vouchers')
    await remove(admin.from('loyality_offer_claims').delete().eq('offer_id', fixture.offerId).eq('customer_id', fixture.customerId), 'offer claim')
    await remove(admin.from('loyality_raffle_entries').delete().eq('raffle_id', fixture.raffleId).eq('customer_id', fixture.customerId), 'raffle entry')
    if (transactionId) {
      await remove(admin.from('loyality_visits').delete().eq('member_transaction_id', transactionId), 'visit')
      await remove(admin.from('member_transactions').delete().eq('id', transactionId), 'member transaction')
    }
    await remove(admin.from('activities').delete().eq('program_id', fixture.programId).ilike('description', `%${receipt}%`), 'activity')
    await remove(admin.from('admin_logs').delete().eq('program_id', fixture.programId).ilike('details', `%${receipt}%`), 'admin log')
    await remove(admin.from('reward_balances').update({ points: fixture.originalPoints }).eq('program_id', fixture.programId).eq('profile_id', fixture.customerId), 'balance restore')
    await remove(admin.from('profiles').update({ phone: fixture.originalPhone }).eq('id', fixture.customerId), 'customer contact restore')
    await remove(admin.from('loyality_raffles').delete().eq('id', fixture.raffleId), 'raffle')
    await remove(admin.from('loyality_voucher_catalog').delete().eq('id', fixture.catalogId), 'catalog item')
    await remove(admin.from('loyality_visit_rules').delete().eq('id', fixture.visitRuleId), 'visit rule')
    await remove(admin.from('loyality_offers').delete().eq('id', fixture.offerId), 'offer')

    if (cleanupErrors.length) throw new Error(`QA cleanup failed: ${cleanupErrors.join('; ')}`)
  })

  test('customer claims an offer and the voucher is recorded', async ({ page }) => {
    const errors = runtimeErrors(page)
    await signIn(page, 'customer@loyality.test', /\/dashboard/)
    await page.goto(`/offer/${fixture.offerToken}?source=qa-full-workflow`)
    await expect(page.getByRole('heading', { name: `${label} Offer`, exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Claim this offer' }).click()
    await expect(page.getByRole('heading', { name: 'Voucher added' })).toBeVisible()

    const voucher = await requiredSingle(
      admin.from('loyality_vouchers').select('id,status,source_kind').eq('customer_id', fixture.customerId).eq('source_id', fixture.offerId).single(),
      'The offer voucher was not recorded',
    )
    expect(voucher.status).toBe('active')
    expect(voucher.source_kind).toBe('acquisition_offer')
    expect(errors).toEqual([])
  })

  test('business records a member QR sale, visit reward, and raffle entry', async ({ page }) => {
    const errors = runtimeErrors(page)
    await signIn(page, 'owner@loyality.test', /\/business\/dashboard/)
    await page.goto('/business/redemptions')
    await page.getByText('Enter a QR link or code manually').click()
    await page.getByLabel('Member QR link or token').fill(fixture.customerToken)
    await page.getByRole('button', { name: 'Load Customer' }).click()
    await expect(page.getByText('Customer selected: Loyality Test Customer')).toBeVisible()
    await page.locator('#original-bill').fill('25')
    await page.locator('#gift-card-receipt-number').fill(receipt)
    await page.getByRole('button', { name: 'Complete Sale', exact: true }).click()
    await expect(page.getByText('Transaction complete')).toBeVisible()

    const transaction = await requiredSingle(
      admin.from('member_transactions').select('id,profile_id,business_id,purchase_amount').eq('program_id', fixture.programId).eq('receipt_number', receipt).single(),
      'The member transaction was not recorded',
    )
    transactionId = transaction.id
    expect(transaction.profile_id).toBe(fixture.customerId)
    expect(transaction.business_id).toBe(fixture.businessId)
    expect(Number(transaction.purchase_amount)).toBe(25)

    const [visit, raffleEntry, visitVoucher] = await Promise.all([
      requiredSingle(admin.from('loyality_visits').select('id').eq('member_transaction_id', transaction.id).single(), 'The visit was not recorded'),
      requiredSingle(admin.from('loyality_raffle_entries').select('id,entry_count').eq('raffle_id', fixture.raffleId).eq('member_transaction_id', transaction.id).single(), 'The raffle entry was not recorded'),
      requiredSingle(admin.from('loyality_vouchers').select('id,status').eq('source_kind', 'visit_rule').eq('source_id', fixture.visitRuleId).eq('source_event_id', transaction.id).single(), 'The visit voucher was not recorded'),
    ])
    expect(visit.id).toBeTruthy()
    expect(Number(raffleEntry.entry_count)).toBe(1)
    expect(visitVoucher.status).toBe('active')
    expect(errors).toEqual([])
  })

  test('customer chooses a catalog voucher without an empty end', async ({ page }) => {
    const errors = runtimeErrors(page)
    await signIn(page, 'customer@loyality.test', /\/dashboard/)
    const title = `${label} Catalog Voucher`
    const heading = page.getByRole('heading', { name: title })
    await expect(heading).toBeVisible()
    await heading.locator('..').getByRole('button', { name: 'Choose' }).click()
    await expect(page.getByText('Voucher added to your wallet.')).toBeVisible()

    const voucher = await requiredSingle(
      admin.from('loyality_vouchers').select('id,public_token,status,source_kind').eq('customer_id', fixture.customerId).eq('source_kind', 'points_catalog').eq('source_id', fixture.catalogId).single(),
      'The catalog voucher was not recorded',
    )
    expect(voucher.status).toBe('active')
    expect(voucher.source_kind).toBe('points_catalog')
    expect(errors).toEqual([])
  })

  test('business redeems the customer voucher and repeat use is blocked', async ({ page }) => {
    const errors = runtimeErrors(page)
    const voucher = await requiredSingle(
      admin.from('loyality_vouchers').select('id,public_token').eq('customer_id', fixture.customerId).eq('source_kind', 'points_catalog').eq('source_id', fixture.catalogId).single(),
      'Could not load the catalog voucher for redemption',
    )
    await signIn(page, 'owner@loyality.test', /\/business\/dashboard/)
    await page.goto(`/business/voucher/${voucher.public_token}`)
    await page.getByRole('button', { name: 'Confirm voucher used' }).click()
    await expect(page.getByText('This voucher has already been recorded as used.')).toBeVisible()
    await page.reload()
    await expect(page.getByText('This voucher has already been recorded as used.')).toBeVisible()

    const redeemed = await requiredSingle(
      admin.from('loyality_vouchers').select('status,redeemed_at').eq('id', voucher.id).single(),
      'The voucher redemption was not recorded',
    )
    expect(redeemed.status).toBe('redeemed')
    expect(redeemed.redeemed_at).toBeTruthy()
    expect(errors).toEqual([])
  })
})
