import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260817235443_atomic_tenant_reward_fulfillment.sql',
    import.meta.url,
  ),
  'utf8',
)
const service = readFileSync(
  new URL('../integrations/supabase/services/admin-service.ts', import.meta.url),
  'utf8',
)
const hook = readFileSync(new URL('../hooks/use-admin-data.ts', import.meta.url), 'utf8')

describe('atomic tenant reward fulfillment', () => {
  it('locks an exact program and business redemption before authorizing the actor', () => {
    expect(migration).toContain('create or replace function public.fulfill_redemption')
    expect(migration).toMatch(/security definer\s+set search_path = ''/i)
    expect(migration).toContain('v_actor_id uuid := auth.uid()')
    expect(migration).toContain('reward_row.program_id = redemption_row.program_id')
    expect(migration).toContain('business_row.program_id = redemption_row.program_id')
    expect(migration).toContain('where redemption_row.id = p_redemption_id')
    expect(migration).toContain('for update of redemption_row')
  })

  it('allows only platform admins or an active exact-business owner or staff membership', () => {
    expect(migration).toContain("v_actor.role::text <> 'platform-admin'")
    expect(migration).toContain('membership.program_id = v_target.program_id')
    expect(migration).toContain('membership.business_id = v_target.business_id')
    expect(migration).toContain('membership.profile_id = v_actor_id')
    expect(migration).toContain("membership.role in ('business-owner', 'business-staff')")
    expect(migration).toContain("membership.status = 'active'")
    expect(migration).toContain('private.has_required_agreements(v_actor_id) is not true')
    expect(migration).toContain('membership.role::text = v_actor.role::text')
    expect(migration).toContain('v_actor.business_id = v_target.business_id')
  })

  it('updates only a ready tenant row and writes the matching tenant audit atomically', () => {
    expect(migration).toMatch(
      /update public\.redemptions redemption_row[\s\S]*redemption_row\.program_id = v_target\.program_id[\s\S]*redemption_row\.reward_id = v_target\.reward_id[\s\S]*redemption_row\.status = 'ready'/,
    )
    expect(migration).toMatch(
      /insert into public\.admin_logs \(\s*program_id,\s*actor_id,\s*actor_name,\s*action,\s*details\s*\) values \(\s*v_target\.program_id,\s*v_actor_id/,
    )
    expect(migration).toContain('returning id into v_admin_log_id')
    expect(migration).toContain("'admin_log_id', v_admin_log_id")
    expect(migration).toContain("'already_fulfilled', false")
  })

  it('exposes the privileged function only to authenticated callers', () => {
    expect(migration).toMatch(
      /revoke all on function public\.fulfill_redemption\(uuid\)\s+from public, anon, authenticated, service_role/,
    )
    expect(migration).toMatch(
      /grant execute on function public\.fulfill_redemption\(uuid\)\s+to authenticated/,
    )
    expect(migration).toContain("notify pgrst, 'reload schema'")
  })

  it('keeps fulfillment in one service call with no client-side patch or log insert', () => {
    const method = service.slice(
      service.indexOf('async fulfillRedemption'),
      service.indexOf('\n  },\n}', service.indexOf('async fulfillRedemption')),
    )

    expect(method).toContain("sb.rpc('fulfill_redemption'")
    expect(method).toContain('p_redemption_id: redemptionId')
    expect(method).toContain('result.redemption.id === redemptionId')
    expect(method).toContain("result.redemption.status === 'fulfilled'")
    expect(method).toContain("result.already_fulfilled || typeof result.admin_log_id === 'string'")
    expect(method).not.toContain(".from('redemptions')")
    expect(method).not.toContain(".from('admin_logs')")
    expect(hook).toContain('adminService.fulfillRedemption(redemptionId)')
    expect(hook).not.toContain('adminService.fulfillRedemption(redemptionId, actor!)')
  })
})
