-- Emergency containment for RewardMe manual membership operations.
-- This intentionally retains requests, memberships, and immutable audit history.
begin;
revoke execute on function public.request_manual_membership(uuid, text, text) from authenticated;
revoke execute on function public.request_manual_membership_cancellation(uuid, text) from authenticated;
revoke execute on function public.cancel_manual_membership_request(uuid, text) from authenticated;
revoke execute on function public.review_manual_membership_request(uuid, text, text, timestamptz) from authenticated;
revoke execute on function public.renew_manual_membership(uuid, uuid, text, timestamptz) from authenticated;
revoke execute on function public.cancel_manual_membership(uuid, uuid, text) from authenticated;
revoke execute on function public.get_manual_membership_requests() from authenticated;

update public.programs
set feature_flags = (feature_flags - 'memberBilling') || '{"savingsPlans":false}'::jsonb,
    updated_at = now()
where slug = 'pinas';
commit;
