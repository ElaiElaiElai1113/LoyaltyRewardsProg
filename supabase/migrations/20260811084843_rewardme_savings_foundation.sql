-- RewardMe savings data foundation. The feature is deliberately double-gated:
-- it must be enabled in both the program flags and the SaaS plan entitlements.
-- This migration does not implement deposits, withdrawals, bonuses, maturity,
-- or payouts. Those money-like mutations remain blocked pending approved rules.

create type public.savings_goal_status as enum ('active', 'completed', 'canceled');
create type public.savings_entry_type as enum ('lock', 'release', 'bonus', 'adjustment');

create table public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  target_points integer not null check (target_points > 0),
  target_date date,
  status public.savings_goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, program_id, profile_id)
);

create index savings_goals_owner_idx
  on public.savings_goals (program_id, profile_id, status, created_at desc);

create table public.savings_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  goal_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  entry_type public.savings_entry_type not null,
  points_delta integer not null check (points_delta <> 0),
  source_reference text,
  note text not null default '',
  created_at timestamptz not null default now(),
  constraint savings_ledger_goal_owner_fk
    foreign key (goal_id, program_id, profile_id)
    references public.savings_goals (id, program_id, profile_id)
    on delete restrict
);

create index savings_ledger_owner_idx
  on public.savings_ledger_entries (program_id, profile_id, created_at desc);
create index savings_ledger_goal_idx
  on public.savings_ledger_entries (goal_id, created_at);
create unique index savings_ledger_source_reference_key
  on public.savings_ledger_entries (program_id, source_reference)
  where source_reference is not null;

drop trigger if exists savings_goals_updated_at on public.savings_goals;
create trigger savings_goals_updated_at
  before update on public.savings_goals
  for each row execute function public.handle_updated_at();

create or replace function public.is_savings_plan_enabled(p_program_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select coalesce((p.feature_flags ->> 'savingsPlans')::boolean, false)
      and coalesce((sp.entitlements -> 'features' ->> 'savingsPlans')::boolean, false)
      and public.is_program_member(p_program_id, array['member']::public.program_role[])
    from public.programs p
    join public.program_subscriptions ps on ps.program_id = p.id
    join public.subscription_plans sp on sp.id = ps.plan_id
    where p.id = p_program_id
      and p.status = 'active'
      and ps.status in ('trialing', 'active')
    limit 1
  ), false);
$$;

revoke all on function public.is_savings_plan_enabled(uuid) from public;
grant execute on function public.is_savings_plan_enabled(uuid) to authenticated;

create or replace function public.enforce_savings_plan_enabled()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_program_id uuid := case when tg_op = 'DELETE' then old.program_id else new.program_id end;
begin
  if not public.is_savings_plan_enabled(v_program_id) then
    raise exception 'savings_plan_not_enabled';
  end if;
  return coalesce(new, old);
end;
$$;

revoke all on function public.enforce_savings_plan_enabled() from public;
grant execute on function public.enforce_savings_plan_enabled() to authenticated;

create trigger enforce_savings_goals_feature
  before insert or update or delete on public.savings_goals
  for each row execute function public.enforce_savings_plan_enabled();
create trigger enforce_savings_ledger_feature
  before insert or update or delete on public.savings_ledger_entries
  for each row execute function public.enforce_savings_plan_enabled();

alter table public.savings_goals enable row level security;
alter table public.savings_ledger_entries enable row level security;

create policy "members read own savings goals"
  on public.savings_goals for select
  to authenticated
  using (
    (select auth.uid()) = profile_id
    and public.is_program_member(program_id, array['member']::public.program_role[])
  );

create policy "members create own enabled savings goals"
  on public.savings_goals for insert
  to authenticated
  with check (
    (select auth.uid()) = profile_id
    and public.is_savings_plan_enabled(program_id)
  );

create policy "members update own enabled savings goals"
  on public.savings_goals for update
  to authenticated
  using (
    (select auth.uid()) = profile_id
    and public.is_savings_plan_enabled(program_id)
  )
  with check (
    (select auth.uid()) = profile_id
    and public.is_savings_plan_enabled(program_id)
  );

create policy "members read own savings ledger"
  on public.savings_ledger_entries for select
  to authenticated
  using (
    (select auth.uid()) = profile_id
    and public.is_program_member(program_id, array['member']::public.program_role[])
  );

revoke all on table public.savings_goals from anon, authenticated;
grant select, insert on table public.savings_goals to authenticated;
grant update (name, target_points, target_date, status) on table public.savings_goals to authenticated;

revoke all on table public.savings_ledger_entries from anon, authenticated;
grant select on table public.savings_ledger_entries to authenticated;

update public.programs
set feature_flags = feature_flags || '{"savingsPlans":false}'::jsonb,
    updated_at = now()
where slug = 'pinas';
