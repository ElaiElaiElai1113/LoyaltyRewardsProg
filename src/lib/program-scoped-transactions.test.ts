import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL('../../supabase/migrations/20260801040000_program_scope_member_transactions.sql', import.meta.url),
  'utf8',
)
const idempotencyMigration = readFileSync(
  new URL('../../supabase/migrations/20260817120452_idempotent_gift_card_redemption.sql', import.meta.url),
  'utf8',
)
const legacyGiftCardRemovalMigration = readFileSync(
  new URL('../../supabase/migrations/20260817123500_drop_legacy_anonymous_gift_card_redeemer.sql', import.meta.url),
  'utf8',
)
const businessOwnerHooks = readFileSync(
  new URL('../hooks/use-business-owner-data.ts', import.meta.url),
  'utf8',
)
const giftCardHooks = readFileSync(
  new URL('../features/gift-cards/hooks/use-gift-cards.ts', import.meta.url),
  'utf8',
)
const transactionPage = readFileSync(
  new URL('../features/gift-cards/pages/redemptions-page.tsx', import.meta.url),
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

  it('replays only an exact QR transaction payload for one request identity', () => {
    expect(idempotencyMigration).toContain('rename to record_member_transaction_once')
    expect(idempotencyMigration).toContain('alter function public.record_member_transaction_once')
    expect(idempotencyMigration).toContain("set search_path = ''")
    expect(idempotencyMigration).toContain('member_transaction.profile_id = member_profile.id')
    expect(idempotencyMigration).toContain('member_transaction.purchase_amount = purchase_amount_value')
    expect(idempotencyMigration).toContain('lower(trim(member_transaction.receipt_number)) = lower(receipt_number_value)')
    expect(idempotencyMigration).toContain('member_transaction.note is not distinct from note_value')
    expect(idempotencyMigration).toContain("event.metadata ->> 'client_request_id' = p_client_request_id::text")
    expect(idempotencyMigration).toContain('select transaction_row.*')
    expect(idempotencyMigration).toContain('from public.record_member_transaction_once(')
    expect(idempotencyMigration).not.toContain('select public.record_member_transaction_once(')
  })

  it('replays a gift-card redemption using the original requested, not clamped, payload', () => {
    expect(idempotencyMigration).toContain('rename to redeem_gift_card_once')
    expect(idempotencyMigration).toContain('alter function public.redeem_gift_card_once')
    expect(idempotencyMigration).toContain('revoke all on function public.redeem_gift_card_once')
    expect(idempotencyMigration).toContain("event.metadata ->> 'client_request_id' = p_client_request_id::text")
    expect(idempotencyMigration).toContain("'client_request_id', p_client_request_id::text")
    expect(idempotencyMigration).toContain('pg_catalog.pg_advisory_xact_lock')
    expect(idempotencyMigration).toContain('pg_catalog.hashtextextended')
    expect(idempotencyMigration).toContain("'requested_original_bill'")
    expect(idempotencyMigration).toContain("'requested_receipt_number'")
    expect(idempotencyMigration).toContain("'requested_gift_card_amount'")
    expect(idempotencyMigration).toContain("pg_catalog.jsonb_typeof(event.metadata -> 'requested_gift_card_amount') = 'null'")
    expect(idempotencyMigration).toContain('pg_catalog.to_jsonb(requested_gift_card_amount_value)')
    expect(idempotencyMigration).toContain("raise exception 'This request was already used for a different transaction.'")
    expect(idempotencyMigration).toContain('grant execute on function public.redeem_gift_card')
  })

  it('removes the obsolete anonymous three-argument gift-card redeemer', () => {
    expect(legacyGiftCardRemovalMigration).toContain(
      'drop function if exists public.redeem_gift_card(uuid, uuid, uuid)',
    )
    expect(legacyGiftCardRemovalMigration).toContain("notify pgrst, 'reload schema'")
  })

  it('refreshes transaction history, balances, activity, customer rows, and business metrics', () => {
    for (const queryKey of [
      "['member-transactions', businessId]",
      "['businessMembers', businessId]",
      "['metrics', businessId]",
      "['reward-balance', profileId]",
      "['activities', profileId]",
    ]) {
      expect(businessOwnerHooks).toContain(queryKey)
    }

    for (const queryKey of [
      "['member-transactions', businessId]",
      "['businessMembers', businessId]",
      "['metrics', businessId]",
      "['reward-balance', giftCard.customerId]",
      "['activities', giftCard.customerId]",
    ]) {
      expect(giftCardHooks).toContain(queryKey)
    }

    expect(transactionPage).toContain("queryClient.refetchQueries({ queryKey: ['member-transactions', business?.id], type: 'active' })")
    expect(transactionPage).toContain("queryClient.refetchQueries({ queryKey: ['gift-cards', 'business', business?.id ?? 'missing'], type: 'active' })")
  })
})
