import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260803130000_remove_legacy_tenant_rpcs_and_harden_views.sql',
  ),
  'utf8',
)
const memberTransactionsService = readFileSync(
  join(process.cwd(), 'src/integrations/supabase/services/member-transactions-service.ts'),
  'utf8',
)
const e2eSupabaseHelper = readFileSync(
  join(process.cwd(), 'tests/e2e/helpers/supabase.ts'),
  'utf8',
)

describe('linked Supabase lint hardening', () => {
  it('removes superseded single-tenant RPC overloads', () => {
    expect(migration).toContain('drop function if exists public.mock_subscribe()')
    expect(migration).toContain('drop function if exists public.mock_renew()')
    expect(migration).toContain('drop function if exists public.consume_reward_credit(uuid)')
    expect(migration).toContain(
      'drop function if exists public.record_member_transaction(text, numeric, text, uuid)',
    )
    expect(memberTransactionsService).not.toContain('legacyData')
    expect(e2eSupabaseHelper).toContain("client.rpc('mock_subscribe', { p_program_id: programId })")
  })

  it('makes compatibility views use caller RLS and avoids checkout temp tables', () => {
    expect(migration).toContain('active_rewards set (security_invoker = true)')
    expect(migration).toContain('active_promotions set (security_invoker = true)')
    expect(migration).toContain('app_customers set (security_invoker = true)')
    expect(migration).toContain('jsonb_to_recordset(normalized_items)')
    expect(migration).not.toContain('pg_temp.checkout_items')
    expect(migration).toContain('on conflict (program_id, profile_id) do nothing')
  })
})
