import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

function readProjectFile(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8')
}

describe('program-scoped business customer links', () => {
  const migration = readProjectFile(
    'supabase/migrations/20260801030000_business_customer_links.sql',
  )
  const registerCustomer = readProjectFile('supabase/functions/register-customer/index.ts')
  const businessOwnerHook = readProjectFile('src/hooks/use-business-owner-data.ts')
  const domainTypes = readProjectFile('src/types/domain.ts')

  it('stores many-to-many links with database-enforced business program scope', () => {
    expect(migration).toContain('alter column program_id drop default')
    expect(migration).toContain('if new.program_id is not null then')
    expect(migration).toContain('create table if not exists public.business_customer_links')
    expect(migration).toContain('primary key (program_id, business_id, profile_id)')
    expect(migration).toContain('foreign key (business_id, program_id)')
    expect(migration).toContain('references public.businesses(id, program_id)')
    expect(migration).toContain('function public.validate_business_customer_link()')
    expect(migration).toContain("raise exception 'active_program_customer_required'")
    expect(migration).toContain('alter table public.business_customer_links enable row level security')
    expect(migration).toContain('pm.status = \'active\'')
  })

  it('backfills safe attribution, order, and transaction relationships', () => {
    expect(migration).toContain("'legacy-attribution'")
    expect(migration).toContain('from public.orders o')
    expect(migration).toContain('from public.member_transactions mt')
    expect(migration).toContain('sync_business_customer_link_from_activity')
    expect(migration).toContain('on conflict (program_id, business_id, profile_id) do nothing')
  })

  it('exposes only a permission-checked, program-derived customer listing', () => {
    expect(migration).toContain('function public.get_business_customers(p_business_id uuid)')
    expect(migration).toContain('public.current_business_id() = p_business_id')
    expect(migration).toContain("array['program-admin']::public.program_role[]")
    expect(migration).toContain('rb.program_id = link.program_id')
    expect(migration).toContain(
      'grant execute on function public.get_business_customers(uuid) to authenticated',
    )

    const hookStart = businessOwnerHook.indexOf('export function useBusinessMembers')
    const hookEnd = businessOwnerHook.indexOf('export function useAwardPoints', hookStart)
    const memberHook = businessOwnerHook.slice(hookStart, hookEnd)
    expect(memberHook).toContain("sb.rpc('get_business_customers'")
    expect(memberHook).not.toContain(".from('profiles')")
    expect(domainTypes).toContain('export interface BusinessCustomerLink')
    expect(domainTypes).toContain('export interface BusinessCustomer')
  })

  it('authorizes point awards through the business link instead of a singleton profile field', () => {
    expect(migration).toContain('create or replace function public.adjust_member_points')
    expect(migration).toContain("raise exception 'business_customer_link_required'")
    expect(migration).toContain('link.profile_id = p_profile_id')
    expect(migration).toContain('actor_pm.business_id = p_business_id')
    expect(migration).toContain("actor_pm.status = 'active'")
    expect(migration).toContain('on conflict (program_id, profile_id) do nothing')
    expect(migration).toContain('rb.program_id = v_program_id')
  })

  it('links same-program active customers idempotently without changing original attribution', () => {
    expect(registerCustomer).toContain('ensureBusinessCustomerLink')
    expect(registerCustomer).toContain(".from('business_customer_links')")
    expect(registerCustomer).toContain(".eq('status', 'active')")
    expect(registerCustomer).toContain("insertError?.code === '23505'")
    expect(registerCustomer).toContain('linkedToBusiness: true')
    expect(registerCustomer).toContain('active_program_id: programId')

    const existingStart = registerCustomer.indexOf('if (existingProfile)')
    const existingEnd = registerCustomer.indexOf('const redirectTo', existingStart)
    const existingCustomerPath = registerCustomer.slice(existingStart, existingEnd)
    expect(existingCustomerPath).not.toContain(
      ".update({ registered_by_business_id: businessId })",
    )
  })
})
