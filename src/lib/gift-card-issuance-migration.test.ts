import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  join(
    process.cwd(),
    'supabase/migrations/20260815090406_preserve_points_for_business_gift_cards.sql',
  ),
  'utf8',
)

describe('business-issued gift card point preservation', () => {
  it('charges points only when a customer claims a card for themselves', () => {
    const customerChargeStart = migration.indexOf("if actor_profile.role = 'customer' then")
    const pointsAssignment = migration.indexOf(
      'points_spent_value := catalog_row.points_cost;',
      customerChargeStart,
    )
    const customerChargeEnd = migration.indexOf('end if;', pointsAssignment)
    const customerChargeBlock = migration.slice(customerChargeStart, customerChargeEnd)

    expect(customerChargeStart).toBeGreaterThan(-1)
    expect(customerChargeBlock).toContain('insert into public.reward_balances')
    expect(customerChargeBlock).toContain("raise exception 'Insufficient points'")
    expect(customerChargeBlock).toContain('set points = points - catalog_row.points_cost')
    expect(customerChargeBlock).toContain('points_spent_value := catalog_row.points_cost')
  })

  it('records zero points spent for authorized business and admin gifts', () => {
    expect(migration).toContain('points_spent_value integer := 0')
    expect(migration).toContain("actor_profile.role not in ('customer', 'platform-admin', 'business-owner')")
    expect(migration).toContain('public.has_active_business_program_access')
    expect(migration).toMatch(/'active',\s+points_spent_value,/)
    expect(migration).toContain("'points_spent', points_spent_value")
    expect(migration).toContain('-points_spent_value')
  })

  it('keeps the RPC private to authenticated users', () => {
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = public')
    expect(migration).toContain(
      'revoke all on function public.issue_gift_card(uuid, uuid) from public',
    )
    expect(migration).toContain(
      'grant execute on function public.issue_gift_card(uuid, uuid) to authenticated',
    )
  })
})
