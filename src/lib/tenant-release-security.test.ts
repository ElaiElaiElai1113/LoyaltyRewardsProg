import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260801050000_harden_tenant_business_and_commerce_flows.sql',
  ),
  'utf8',
)
const registerCustomer = readFileSync(
  join(process.cwd(), 'supabase/functions/register-customer/index.ts'),
  'utf8',
)

function functionBody(name: string, nextName?: string) {
  const start = migration.indexOf(`function public.${name}(`)
  expect(start, `${name} must exist in the final hardening migration`).toBeGreaterThan(-1)
  const end = nextName
    ? migration.indexOf(`function public.${nextName}(`, start + 1)
    : migration.length
  return migration.slice(start, end > start ? end : migration.length)
}

describe('final tenant release security hardening', () => {
  it('binds business access to an active exact program, business, and role membership', () => {
    const helper = functionBody(
      'has_active_business_program_access',
      'get_business_customers',
    )

    expect(helper).toContain('pm.program_id = b.program_id')
    expect(helper).toContain('pm.business_id = b.id')
    expect(helper).toContain('pm.profile_id = auth.uid()')
    expect(helper).toContain("pm.status = 'active'")
    expect(helper).toContain('pm.role = any(p_roles)')
    expect(helper).toContain('p.role::text = pm.role::text')
    expect(helper).toContain('public.has_staff_access()')

    expect(migration).toMatch(
      /policy "business teams read their customer links"[\s\S]*has_active_business_program_access/,
    )
    expect(migration).toMatch(
      /policy "business teams create their customer links"[\s\S]*linked_by = auth\.uid\(\)[\s\S]*has_active_business_program_access/,
    )
    expect(functionBody('get_business_customers', 'create_owner_product')).toContain(
      'public.has_active_business_program_access',
    )
  })

  it('requires the same active business membership in the service-role registration path', () => {
    const programAccessStart = registerCustomer.indexOf(".from('program_memberships')")
    const existingCustomerStart = registerCustomer.indexOf('if (existingProfile)')
    const actorAuthorization = registerCustomer.slice(programAccessStart, existingCustomerStart)

    expect(actorAuthorization).toContain(".eq('program_id', programId)")
    expect(actorAuthorization).toContain(".eq('profile_id', actor.id)")
    expect(actorAuthorization).toContain(".eq('business_id', businessId)")
    expect(actorAuthorization).toContain(".eq('role', actor.role)")
    expect(actorAuthorization).toContain(".eq('status', 'active')")
    expect(actorAuthorization).toContain('Active business program access is required.')
  })

  it.each([
    ['create_owner_product', 'create_owner_promotion'],
    ['create_owner_promotion', 'create_owner_gift_card_catalog_item'],
    ['create_owner_gift_card_catalog_item', 'issue_gift_card'],
  ])('%s derives program ownership from the authorized business', (name, nextName) => {
    const body = functionBody(name, nextName)
    expect(body).toContain('public.has_active_business_program_access')
    expect(body).toContain('business_row.program_id')
    expect(body).toMatch(/insert into public\.[a-z_]+ \(\s*program_id,/)
  })

  it('keeps checkout in one active tenant and uses the composite reward balance key', () => {
    const body = functionBody('place_order', 'redeem_reward')

    expect(body).toContain('pm.program_id = business_row.program_id')
    expect(body).toContain("pm.role = 'member'")
    expect(body).toContain("pm.status = 'active'")
    expect(body).toContain('p.program_id <> business_row.program_id')
    expect(body).toMatch(/insert into public\.orders \(\s*program_id,/)
    expect(body).toMatch(/insert into public\.order_line_items \(\s*program_id,/)
    expect(body).toContain('on conflict (program_id, profile_id) do nothing')
    expect(body).toContain('where program_id = business_row.program_id')
    expect(body).not.toContain('on conflict (profile_id)')
  })

  it('keeps reward redemption, issuance, and business gift-card reads tenant-scoped', () => {
    const redeem = functionBody('redeem_reward')
    const issue = functionBody('issue_gift_card', 'get_business_gift_cards')
    const businessCards = functionBody('get_business_gift_cards', 'credit_partner_referral')

    expect(redeem).toContain('m.program_id = reward_row.program_id')
    expect(redeem).toContain('on conflict (program_id, profile_id) do nothing')
    expect(redeem).toMatch(/insert into public\.redemptions \(\s*program_id,/)
    expect(redeem).not.toContain('on conflict (profile_id)')
    expect(issue).toContain('public.has_active_business_program_access')
    expect(issue).toContain('on conflict (program_id, profile_id) do nothing')
    expect(businessCards).toContain('public.has_active_business_program_access')
  })

  it('prevents direct invocation of internal partner-credit mutation', () => {
    const partnerCredit = functionBody('credit_partner_referral', 'place_order')
    expect(partnerCredit).toContain('o.program_id = b.program_id')
    expect(partnerCredit).toContain('program_id = v_program_id')
    expect(partnerCredit).toContain(
      'revoke all on function public.credit_partner_referral(uuid, uuid, uuid) from public, anon, authenticated',
    )
  })
})
