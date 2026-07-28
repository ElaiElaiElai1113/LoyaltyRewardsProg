import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const foundation = readFileSync('supabase/migrations/20260725000000_four_brand_saas_foundation.sql', 'utf8')
const guards = readFileSync('supabase/migrations/20260725010000_tenant_write_guards.sql', 'utf8')
const authProvisioning = readFileSync(
  'supabase/migrations/20260726000000_allow_auth_user_tenant_provisioning.sql',
  'utf8',
)

describe('tenant database migrations', () => {
  it('creates all four seeded programs and tenant identity tables', () => {
    for (const name of ['Medellin Rewards', 'Guatemala Rewards', 'Synergize', 'Davao Rewards']) {
      expect(foundation).toContain(name)
    }
    expect(foundation).toContain('create table public.program_memberships')
    expect(foundation).toContain('create table public.program_subscriptions')
  })

  it('adds fail-closed write and relationship guards', () => {
    expect(guards).toContain('cross_program_access_denied')
    expect(guards).toContain('cross_program_business_reference')
    expect(guards).toContain('create trigger enforce_tenant_write_access')
    expect(guards).toContain('create trigger enforce_business_program_match')
  })

  it('allows Supabase Auth to provision tenant-scoped signup records', () => {
    expect(authProvisioning).toContain("session_user = 'supabase_auth_admin'")
    expect(authProvisioning).toContain("v_role = 'service_role'")
    expect(authProvisioning).toContain("raise exception 'cross_program_access_denied'")
  })

  it('scopes leads and balances by program', () => {
    expect(foundation).toContain('reward_balances_program_profile_key')
    expect(guards).toContain('idx_early_access_leads_program_email_unique')
    expect(guards).toContain('create_program_early_access_lead')
  })

  it('supports plan enforcement and idempotent Stripe delivery', () => {
    expect(guards).toContain('get_plan_entitlements')
    expect(guards).toContain('administrator_limit_reached')
    expect(guards).toContain('create table public.stripe_webhook_events')
  })
})
