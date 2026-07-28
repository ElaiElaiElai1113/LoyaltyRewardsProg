-- Read-only preflight. Run before and after tenant SaaS migrations.
with issues as (
  select 'program_without_subscription' as check_name, p.id::text as record_id, p.slug as detail
  from public.programs p
  left join public.program_subscriptions s on s.program_id = p.id
  where s.program_id is null
  union all
  select 'program_without_active_admin', p.id::text, p.slug
  from public.programs p
  where not exists (
    select 1 from public.program_memberships m
    where m.program_id = p.id and m.role = 'program-admin' and m.status = 'active'
  )
  union all
  select 'membership_without_profile', m.id::text, m.program_id::text
  from public.program_memberships m
  left join public.profiles p on p.id = m.profile_id
  where p.id is null
  union all
  select 'business_without_program', b.id::text, coalesce(b.slug, '')
  from public.businesses b
  left join public.programs p on p.id = b.program_id
  where p.id is null
  union all
  select 'balance_without_program', b.id::text, b.profile_id::text
  from public.reward_balances b
  left join public.programs p on p.id = b.program_id
  where p.id is null
  union all
  select 'negative_reward_balance', b.id::text, b.points::text
  from public.reward_balances b
  where b.points < 0 or b.available_credits < 0
  union all
  select 'invalid_verification_path', p.id::text, coalesce(p.verification_document_path, '')
  from public.profiles p
  where p.verification_document_path is not null
    and p.verification_document_path !~ '^pending/[0-9a-f-]{36}/'
  union all
  select 'invalid_currency', p.id::text, p.currency
  from public.programs p
  where p.currency !~ '^[A-Z]{3}$'
  union all
  select 'invalid_timezone', p.id::text, p.timezone
  from public.programs p
  where not exists (select 1 from pg_timezone_names t where t.name = p.timezone)
)
select check_name, count(*) as issue_count, coalesce(jsonb_agg(jsonb_build_object(
  'record_id', record_id, 'detail', detail
) order by record_id) filter (where record_id is not null), '[]'::jsonb) as examples
from issues
group by check_name
order by check_name;
