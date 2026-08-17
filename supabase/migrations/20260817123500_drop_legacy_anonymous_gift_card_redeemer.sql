-- Remove the obsolete pre-ledger redemption overload. It accepted a caller-
-- supplied profile id and was still exposed to anonymous API callers. The
-- current six-argument redeem_gift_card RPC is the only supported workflow and
-- performs authenticated role, tenant, business, balance, and audit checks.
drop function if exists public.redeem_gift_card(uuid, uuid, uuid);

notify pgrst, 'reload schema';
