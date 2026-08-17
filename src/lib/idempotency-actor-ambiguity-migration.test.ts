import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

function read(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

function functionDefinition(sql: string, name: string, occurrence = 1) {
  const pattern = new RegExp(
    `create(?: or replace)? function public\\.${name}\\([\\s\\S]*?\\n\\$\\$;`,
    'gi',
  )
  const matches = [...sql.matchAll(pattern)]
  const definition = matches[occurrence - 1]?.[0]

  expect(definition, `${name} definition ${occurrence} should exist`).toBeDefined()
  return definition ?? ''
}

describe('idempotency actor identity migrations', () => {
  it('uses v_actor_id in the fresh-install implementations and wrappers', () => {
    const transactionSource = read(
      'supabase/migrations/20260801040000_program_scope_member_transactions.sql',
    )
    const rewardSource = read(
      'supabase/migrations/20260801050000_harden_tenant_business_and_commerce_flows.sql',
    )
    const transactionWrappers = read(
      'supabase/migrations/20260817120452_idempotent_gift_card_redemption.sql',
    )
    const rewardWrapper = read(
      'supabase/migrations/20260817121855_strict_reward_redemption_idempotency.sql',
    )

    const definitions = [
      functionDefinition(transactionSource, 'record_member_transaction'),
      functionDefinition(transactionSource, 'redeem_gift_card'),
      functionDefinition(rewardSource, 'redeem_reward'),
      functionDefinition(transactionWrappers, 'record_member_transaction'),
      functionDefinition(transactionWrappers, 'redeem_gift_card'),
      functionDefinition(rewardWrapper, 'redeem_reward'),
    ]

    for (const definition of definitions) {
      expect(definition).toContain('v_actor_id uuid := auth.uid()')
      expect(definition).not.toMatch(/\bactor_id uuid := auth\.uid\(\)/)
    }
  })

  it('recreates all six hosted functions without ambiguous actor references', () => {
    const migration = read(
      'supabase/migrations/20260817125922_fix_idempotency_actor_id_ambiguity.sql',
    )
    const functionNames = [
      'record_member_transaction_once',
      'record_member_transaction',
      'redeem_gift_card_once',
      'redeem_gift_card',
      'redeem_reward_once',
      'redeem_reward',
    ]

    for (const name of functionNames) {
      const definition = functionDefinition(migration, name)
      expect(definition).toContain('v_actor_id uuid := auth.uid()')
      expect(definition).toMatch(/security definer\s+set search_path = ''/i)
      expect(definition).not.toMatch(/\bactor_id uuid := auth\.uid\(\)/)
    }

    expect(migration).not.toContain('plpgsql.variable_conflict')
    expect(migration).not.toMatch(/event\.actor_id = actor_id\b/)
    expect(migration).not.toMatch(/recorded_by = actor_id\b/)
    expect(migration).not.toMatch(/profile_id = actor_id\b/)
    expect(migration.match(/create or replace function public\./g)).toHaveLength(6)
  })

  it('keeps private functions private and public RPCs authenticated-only', () => {
    const migration = read(
      'supabase/migrations/20260817125922_fix_idempotency_actor_id_ambiguity.sql',
    )

    for (const signature of [
      'record_member_transaction_once(text, numeric, text, text, uuid)',
      'redeem_gift_card_once(uuid, uuid, numeric, text, numeric, uuid)',
      'redeem_reward_once(uuid, text, text, uuid)',
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${signature.replace(/[()]/g, '\\$&')}[\\s\\S]*?from public, anon, authenticated, service_role`,
          'i',
        ),
      )
    }

    for (const signature of [
      'record_member_transaction(text, numeric, text, text, uuid)',
      'redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid)',
      'redeem_reward(uuid, text, text, uuid)',
    ]) {
      expect(migration).toMatch(
        new RegExp(
          `grant execute on function public\\.${signature.replace(/[()]/g, '\\$&')}[\\s\\S]*?to authenticated`,
          'i',
        ),
      )
    }
  })
})
