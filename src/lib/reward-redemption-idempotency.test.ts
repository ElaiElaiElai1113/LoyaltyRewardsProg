import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('reward redemption retry safety', () => {
  it('keeps one request ID for a form until the submission succeeds', () => {
    const panel = read('src/features/rewards/components/redeem-reward-panel.tsx')

    expect(panel).toContain('const [clientRequestId, setClientRequestId] = useState(createClientRequestId)')
    expect(panel).toContain('clientRequestId,')

    const submitStart = panel.indexOf('await onSubmit({')
    const reset = panel.indexOf('setClientRequestId(createClientRequestId())', submitStart)
    expect(submitStart).toBeGreaterThan(-1)
    expect(reset).toBeGreaterThan(submitStart)
  })

  it('passes the form request ID to the replay-safe database RPC', () => {
    const service = read('src/integrations/supabase/services/rewards-service.ts')
    const legacyMigration = read('supabase/migrations/20260801050000_harden_tenant_business_and_commerce_flows.sql')

    expect(service).toContain('clientRequestId: string')
    expect(service).toContain('p_client_request_id: input.clientRequestId')
    expect(service).not.toContain('p_client_request_id: createClientRequestId()')
    expect(legacyMigration).toContain('and client_request_id = p_client_request_id')
    expect(legacyMigration).toContain('if found then return existing_redemption; end if;')
  })

  it('replays only an exact normalized payload through a locked, private implementation', () => {
    const migration = read('supabase/migrations/20260817121855_strict_reward_redemption_idempotency.sql')

    expect(migration).toMatch(/rename to redeem_reward_once/i)
    expect(migration).toMatch(/alter function public\.redeem_reward_once\([\s\S]*?set search_path = ''/i)
    expect(migration).toMatch(
      /revoke all on function public\.redeem_reward_once\([\s\S]*?from public, anon, authenticated, service_role/i,
    )
    expect(migration).toMatch(/security definer\s+set search_path = ''/i)
    expect(migration).toContain('pg_catalog.pg_advisory_xact_lock')
    expect(migration).toContain("normalized_pickup_window text := trim(coalesce(p_pickup_window, ''))")
    expect(migration).toContain("normalized_notes text := nullif(trim(coalesce(p_notes, '')), '')")
    expect(migration).toContain('result_redemption.program_id <> requested_program_id')
    expect(migration).toContain('result_redemption.reward_id <> p_reward_id')
    expect(migration).toContain('trim(result_redemption.pickup_window) <> normalized_pickup_window')
    expect(migration).toMatch(/result_redemption\.notes[\s\S]*?is distinct from normalized_notes/i)
    expect(migration).toContain('This request was already used for a different reward redemption.')
    expect(migration).toMatch(
      /revoke all on function public\.redeem_reward\([\s\S]*?from public, anon, service_role/i,
    )
    expect(migration).toMatch(/grant execute on function public\.redeem_reward\([\s\S]*?to authenticated/i)
  })
})
