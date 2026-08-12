import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const foundation = readFileSync('supabase/migrations/20260725000000_four_brand_saas_foundation.sql', 'utf8')
const guards = readFileSync('supabase/migrations/20260725010000_tenant_write_guards.sql', 'utf8')
const authProvisioning = readFileSync(
  'supabase/migrations/20260726000000_allow_auth_user_tenant_provisioning.sql',
  'utf8',
)
const limitsAndStorage = readFileSync(
  'supabase/migrations/20260728000000_tenant_limits_and_storage_isolation.sql',
  'utf8',
)
const platformOperations = readFileSync(
  'supabase/migrations/20260729000000_program_state_usage_and_audit.sql',
  'utf8',
)
const tenantOperations = readFileSync(
  'supabase/migrations/20260730000000_domain_team_and_import_operations.sql',
  'utf8',
)
const pinasRename = readFileSync(
  'supabase/migrations/20260730010000_rename_davao_to_pinas.sql',
  'utf8',
)
const serviceRoleClaimsFix = readFileSync(
  'supabase/migrations/20260802170418_fix_service_role_jwt_claim_detection.sql',
  'utf8',
)
const programAgreementScope = readFileSync(
  'supabase/migrations/20260802170947_scope_agreements_to_program_memberships.sql',
  'utf8',
)
const synergizeSeparation = readFileSync(
  'supabase/migrations/20260802173500_restore_synergize_application_separation.sql',
  'utf8',
)

describe('tenant database migrations', () => {
  it('creates all four seeded programs and tenant identity tables', () => {
    for (const name of ['Medellin Rewards', 'Guatemala Rewards', 'Synergize']) {
      expect(foundation).toContain(name)
    }
    expect(pinasRename).toContain('Pinas Rewards')
    expect(pinasRename).toContain("slug = 'pinas'")
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

  it('recognizes service-role requests from the current PostgREST JWT claims setting', () => {
    expect(serviceRoleClaimsFix).toContain("current_setting('request.jwt.claims', true)")
    expect(serviceRoleClaimsFix).toContain("v_role = 'service_role'")
    expect(serviceRoleClaimsFix).toContain('enforce_tenant_write_access')
    expect(serviceRoleClaimsFix).toContain('enforce_program_resource_limit')
    expect(serviceRoleClaimsFix).toContain('enforce_program_feature')
  })

  it('scopes required agreements to active program memberships', () => {
    expect(programAgreementScope).toContain('pm.program_id = av.program_id')
    expect(programAgreementScope).toContain('aa.program_id = av.program_id')
    expect(programAgreementScope).toContain('public.is_program_member(program_id)')
  })

  it('keeps the separate Synergize application outside Rewards Platform hosting and entitlements', () => {
    expect(synergizeSeparation).toContain("hostname = 'synergize.example'")
    expect(synergizeSeparation).toContain("p.slug = 'synergize'")
    expect(synergizeSeparation).toContain("sp.code = 'launch'")
    expect(synergizeSeparation).toContain("ps.stripe_customer_id is null")
  })

  it('scopes leads and balances by program', () => {
    expect(foundation).toContain('reward_balances_program_profile_key')
    expect(guards).toContain('idx_early_access_leads_program_email_unique')
    expect(guards).toContain('create_program_early_access_lead')
  })

  it('supports plan enforcement while retaining the legacy event schema for migration compatibility', () => {
    expect(guards).toContain('get_plan_entitlements')
    expect(guards).toContain('administrator_limit_reached')
    expect(guards).toContain('create table public.stripe_webhook_events')
  })

  it('prepares approval-gated plan limits and tenant-isolated storage policies', () => {
    expect(limitsAndStorage).toContain("enforce_program_resource_limit('customDomains')")
    expect(limitsAndStorage).toContain("enforce_program_resource_limit('businesses')")
    expect(limitsAndStorage).toContain("enforce_program_resource_limit('members')")
    expect(limitsAndStorage).toContain('(storage.foldername(name))[2]')
    expect(limitsAndStorage).toContain('Program admins view tenant verification IDs')
  })

  it('prepares status-aware resolution, platform usage, and lifecycle auditing', () => {
    expect(platformOperations).toContain('resolve_program_host_state')
    expect(platformOperations).toContain('get_platform_program_usage')
    expect(platformOperations).toContain('enforce_program_feature')
    expect(platformOperations).toContain('program_status_changed')
    expect(platformOperations).toContain('platform_admin_required')
  })

  it('prepares secure domain, team, and idempotent import operations', () => {
    expect(tenantOperations).toContain('request_program_domain')
    expect(tenantOperations).toContain('verified_domain_required')
    expect(tenantOperations).toContain('last_program_admin')
    expect(tenantOperations).toContain('unique (program_id, idempotency_key)')
  })
})
