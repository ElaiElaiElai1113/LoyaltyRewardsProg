import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()
const migration = readFileSync(resolve(root, 'supabase/migrations/20260824170041_loyality_single_business_platform.sql'), 'utf8')
const home = readFileSync(resolve(root, 'src/features/loyality/pages/loyality-home-page.tsx'), 'utf8')
const service = readFileSync(resolve(root, 'src/features/loyality/loyality-service.ts'), 'utf8')
const businessGrowth = readFileSync(resolve(root, 'src/features/loyality/pages/loyality-business-growth-page.tsx'), 'utf8')

describe('Loyality product contract', () => {
  it('is a separate, single-business tenant on Loyalty Platforms', () => {
    expect(migration).toContain('"loyalitySingleBusiness":true')
    expect(migration).toContain("'10000000-0000-4000-8000-000000000007'")
    expect(migration).toContain("'loyality-rewards.vercel.app'")
    expect(migration).toContain('unique (program_id)')
  })

  it('implements acquisition, referral, visits, specific vouchers, and raffles', () => {
    for (const table of [
      'loyality_offers',
      'loyality_offer_claims',
      'loyality_visits',
      'loyality_visit_rules',
      'loyality_vouchers',
      'loyality_raffle_entries',
    ]) expect(migration).toContain(`public.${table}`)
    expect(migration).toContain('claim_loyality_offer')
    expect(migration).toContain('process_loyality_member_transaction')
    expect(migration).toContain('referral_reward_issued_at')
  })

  it('keeps POS and marketplace concepts out of the Loyality customer promise', () => {
    expect(home).toContain('No POS integration')
    expect(home).toContain('Visit-based rewards')
    expect(home).toContain('Your loyalty card,')
    expect(home).toContain('reimagined.')
    expect(home).not.toContain('partner businesses')
    expect(service).toContain("sourceKind: 'acquisition_offer' | 'referral' | 'visit_rule' | 'points_catalog' | 'manual'")
  })

  it('lets business owners pause, reactivate, cancel, and safely delete unused raffles', () => {
    expect(service).toContain('async setRaffleStatus')
    expect(service).toContain(".from('loyality_raffle_entries')")
    expect(service).toContain('already has entries')
    expect(service).toContain('async deleteRaffle')
    expect(businessGrowth).toContain('Manage raffles')
    expect(businessGrowth).toContain('Raffle paused.')
    expect(businessGrowth).toContain('Raffle cancelled.')
    expect(businessGrowth).toContain('Unused raffle deleted.')
  })
})
