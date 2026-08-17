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

  it('persists partial and final gift-card balances with the matching sale ledger', () => {
    expect(migration).toContain('for update;')
    expect(migration).toContain('remaining_balance_after_value := round(greatest(available_balance_value - gift_card_amount_value, 0)::numeric, 2)')
    expect(migration).toContain("when remaining_balance_after_value <= 0 then 'redeemed'::public.gift_card_status")
    expect(migration).toContain("else 'active'::public.gift_card_status")
    expect(migration).toContain('remaining_balance = remaining_balance_after_value')
    expect(migration).toContain('insert into public.member_transactions (\n      program_id')
    expect(migration).toContain('p_client_request_id')
    expect(migration).toContain('set points = points + points_awarded_value')
    expect(migration).toContain("'gift_card_redeemed'")
  })

  it('rejects cross-business, inactive, and duplicate-receipt gift-card charges', () => {
    expect(migration).toContain("if card_row.business_id <> p_business_id then raise exception 'Gift card belongs to a different business'")
    expect(migration).toContain("if card_row.status = 'redeemed' then raise exception 'Gift card has no remaining balance'")
    expect(migration).toContain("if card_row.status <> 'active' then raise exception 'Gift card is not active'")
    expect(migration).toContain("raise exception 'This receipt or bill number has already been recorded.'")
  })
})
