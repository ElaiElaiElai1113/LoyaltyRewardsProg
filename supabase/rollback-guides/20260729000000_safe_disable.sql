-- Manual emergency containment for migration 20260729000000.
-- Preserves audit rows and all tenant records.
begin;
drop trigger if exists enforce_gift_cards_entitlement on public.gift_card_catalog;
drop trigger if exists enforce_gift_cards_entitlement on public.gift_cards;
drop trigger if exists enforce_gift_cards_entitlement on public.gift_card_events;
drop trigger if exists enforce_referrals_entitlement on public.partner_referrers;
drop trigger if exists enforce_referrals_entitlement on public.partner_referrals;
drop trigger if exists enforce_referrals_entitlement on public.partner_credit_ledger;
revoke execute on function public.resolve_program_host_state(text) from anon, authenticated;
revoke execute on function public.resolve_program_email_brand(text) from anon, authenticated;
revoke execute on function public.get_platform_program_usage() from authenticated;
revoke execute on function public.set_program_status(uuid, public.program_status, text) from authenticated;
commit;
