insert into public.program_subscriptions (program_id, plan_id, status)
select
  '10000000-0000-4000-8000-000000000001'::uuid,
  sp.id,
  'trialing'::public.program_subscription_status
from public.subscription_plans sp
where sp.code = 'launch'
on conflict (program_id) do update
set
  plan_id = coalesce(public.program_subscriptions.plan_id, excluded.plan_id),
  status = case
    when public.program_subscriptions.plan_id is null then 'trialing'::public.program_subscription_status
    else public.program_subscriptions.status
  end,
  updated_at = now();
