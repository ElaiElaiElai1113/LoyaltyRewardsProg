-- Enable the existing non-Stripe launch allowance for the remaining active
-- white-label tenants. "trialing" is an internal access state only: no Stripe
-- customer, subscription, or payment method is created by this migration.
insert into public.program_subscriptions (program_id, plan_id, status)
select
  p.id,
  sp.id,
  'trialing'::public.program_subscription_status
from public.programs p
cross join public.subscription_plans sp
where p.slug in ('pinas', 'guatemala', 'synergize')
  and sp.code = 'launch'
on conflict (program_id) do update
set
  plan_id = coalesce(public.program_subscriptions.plan_id, excluded.plan_id),
  status = case
    when public.program_subscriptions.plan_id is null then 'trialing'::public.program_subscription_status
    else public.program_subscriptions.status
  end,
  updated_at = now();
