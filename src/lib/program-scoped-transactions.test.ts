import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL('../../supabase/migrations/20260801040000_program_scope_member_transactions.sql', import.meta.url),
  'utf8',
)

describe('program-scoped member transactions', () => {
  it('uses the composite reward balance identity for QR sales', () => {
    expect(migration).toContain('create or replace function public.record_member_transaction')
    expect(migration).toContain('on conflict (program_id, profile_id) do nothing')
    expect(migration).toContain('where program_id = business_row.program_id')
    expect(migration).not.toMatch(/on conflict \(profile_id\)/)
  })

  it('keeps gift-card redemption in the business program', () => {
    expect(migration).toContain('create function public.redeem_gift_card')
    expect(migration).toContain("if card_row.program_id <> business_row.program_id")
    expect(migration).toContain('insert into public.gift_card_events (program_id')
    expect(migration).toContain('insert into public.member_transactions (\n      program_id')
    expect(migration).toContain('remaining_value_amount = remaining_balance_after_value')
  })
})
