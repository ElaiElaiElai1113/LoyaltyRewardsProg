-- RewardMe uses staff-reviewed membership activation without online payments.
-- Browser clients may read their own requests, but all mutations go through
-- authenticated RPCs with explicit ownership or platform-admin checks.

do $$
begin
  create type public.manual_membership_request_status as enum (
    'pending',
    'approved',
    'rejected',
    'canceled'
  );
exception
  when duplicate_object then null;
end;
$$;

alter table public.memberships
  drop constraint if exists memberships_profile_matches_auth,
  add column if not exists tier text not null default 'regular'
    check (tier in ('regular', 'gold')),
  add column if not exists provider_status text not null default 'manual';

do $$
begin
  if exists (
    select 1
    from public.memberships
    where provider = 'stripe'
  ) then
    raise exception 'stripe_memberships_require_manual_reconciliation';
  end if;
end;
$$;

drop index if exists public.memberships_stripe_subscription_idx;
drop index if exists public.memberships_stripe_customer_idx;
drop table if exists public.stripe_member_webhook_events;

alter table public.memberships
  drop column if exists provider_price_id,
  drop column if exists stripe_customer_id,
  drop column if exists billing_email;

update public.memberships m
set provider = 'manual',
    provider_status = case when m.status = 'active' then 'active' else 'inactive' end,
    provider_subscription_id = null,
    updated_at = now()
from public.programs p
where p.id = m.program_id
  and p.slug = 'pinas'
  and m.provider <> 'manual';

update public.programs
set feature_flags = feature_flags - 'memberBilling',
    updated_at = now()
where slug = 'pinas';

create table if not exists public.manual_membership_requests (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null,
  profile_id uuid not null,
  request_kind text not null default 'enrollment'
    check (request_kind in ('enrollment', 'cancellation')),
  requested_tier text not null
    check (requested_tier in ('regular', 'gold')),
  status public.manual_membership_request_status not null default 'pending',
  member_note text not null default '' check (char_length(member_note) <= 1000),
  reviewer_note text not null default '' check (char_length(reviewer_note) <= 2000),
  reviewed_by uuid,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint manual_membership_requests_program_fk
    foreign key (program_id) references public.programs(id) on delete restrict,
  constraint manual_membership_requests_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete cascade,
  constraint manual_membership_requests_reviewer_fk
    foreign key (reviewed_by) references public.profiles(id) on delete set null
);

create unique index if not exists manual_membership_requests_one_pending_idx
  on public.manual_membership_requests (program_id, profile_id)
  where status = 'pending';
create index if not exists manual_membership_requests_queue_idx
  on public.manual_membership_requests (program_id, status, requested_at desc);
create index if not exists manual_membership_requests_profile_idx
  on public.manual_membership_requests (profile_id, requested_at desc);
create index if not exists manual_membership_requests_reviewer_idx
  on public.manual_membership_requests (reviewed_by)
  where reviewed_by is not null;

create table if not exists public.manual_membership_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid,
  program_id uuid not null,
  profile_id uuid not null,
  actor_profile_id uuid,
  event_type text not null check (
    event_type in (
      'requested',
      'request_canceled',
      'approved',
      'rejected',
      'membership_renewed',
      'membership_canceled'
    )
  ),
  tier text not null check (tier in ('regular', 'gold')),
  from_status text,
  to_status text not null,
  reason text not null default '' check (char_length(reason) <= 2000),
  created_at timestamptz not null default now(),
  constraint manual_membership_events_request_fk
    foreign key (request_id) references public.manual_membership_requests(id) on delete restrict,
  constraint manual_membership_events_program_fk
    foreign key (program_id) references public.programs(id) on delete restrict,
  constraint manual_membership_events_profile_fk
    foreign key (profile_id) references public.profiles(id) on delete cascade,
  constraint manual_membership_events_actor_fk
    foreign key (actor_profile_id) references public.profiles(id) on delete set null
);

create index if not exists manual_membership_events_request_idx
  on public.manual_membership_events (request_id, created_at);
create index if not exists manual_membership_events_member_idx
  on public.manual_membership_events (program_id, profile_id, created_at desc);
create index if not exists manual_membership_events_profile_idx
  on public.manual_membership_events (profile_id, created_at desc);
create index if not exists manual_membership_events_actor_idx
  on public.manual_membership_events (actor_profile_id)
  where actor_profile_id is not null;
create index if not exists manual_membership_events_created_idx
  on public.manual_membership_events (created_at desc);

drop trigger if exists manual_membership_requests_updated_at on public.manual_membership_requests;
create trigger manual_membership_requests_updated_at
  before update on public.manual_membership_requests
  for each row execute function public.handle_updated_at();

alter table public.manual_membership_requests enable row level security;
alter table public.manual_membership_events enable row level security;

drop policy if exists "members read own manual membership requests" on public.manual_membership_requests;
create policy "members read own manual membership requests"
  on public.manual_membership_requests for select
  to authenticated
  using ((select auth.uid()) = profile_id or (select public.is_platform_admin()));

drop policy if exists "members read own manual membership events" on public.manual_membership_events;
create policy "members read own manual membership events"
  on public.manual_membership_events for select
  to authenticated
  using ((select auth.uid()) = profile_id or (select public.is_platform_admin()));

drop policy if exists "platform admins read memberships" on public.memberships;
create policy "platform admins read memberships"
  on public.memberships for select
  to authenticated
  using ((select public.is_platform_admin()));

drop policy if exists "Users can create own membership" on public.memberships;
drop policy if exists "Users can update own membership" on public.memberships;

revoke all on table public.manual_membership_requests from anon, authenticated;
revoke all on table public.manual_membership_events from anon, authenticated;
grant select on table public.manual_membership_requests to authenticated;
grant select on table public.manual_membership_events to authenticated;

revoke insert, update, delete on table public.memberships from anon, authenticated;
grant select on table public.memberships to authenticated;

create or replace function public.enforce_rewardme_manual_membership_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_program_id uuid := case when tg_op = 'DELETE' then old.program_id else new.program_id end;
  v_provider text := case when tg_op = 'DELETE' then old.provider else new.provider end;
begin
  if exists (select 1 from public.programs p where p.id = v_program_id and p.slug = 'pinas') then
    if v_provider <> 'manual' then
      raise exception 'rewardme_manual_membership_required';
    end if;
    if not public.is_platform_admin()
      and coalesce((select auth.jwt() ->> 'role'), '') <> 'service_role' then
      raise exception 'rewardme_membership_operations_required';
    end if;
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_rewardme_manual_membership_mutation() from public, anon, authenticated;

drop trigger if exists enforce_rewardme_manual_membership_mutation on public.memberships;
create trigger enforce_rewardme_manual_membership_mutation
  before insert or update or delete on public.memberships
  for each row execute function public.enforce_rewardme_manual_membership_mutation();

create or replace function public.request_manual_membership(
  p_program_id uuid,
  p_tier text,
  p_member_note text default ''
)
returns public.manual_membership_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_request public.manual_membership_requests%rowtype;
  v_profile public.profiles%rowtype;
begin
  if v_actor_id is null then
    raise exception 'authentication_required';
  end if;
  if p_tier is null or p_tier not in ('regular', 'gold') then
    raise exception 'invalid_membership_tier';
  end if;
  if char_length(trim(coalesce(p_member_note, ''))) > 1000 then
    raise exception 'membership_note_too_long';
  end if;
  if not exists (
    select 1
    from public.programs p
    where p.id = p_program_id and p.slug = 'pinas' and p.status = 'active'
  ) then
    raise exception 'rewardme_program_required';
  end if;
  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = p_program_id
      and pm.profile_id = v_actor_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'active_member_account_required';
  end if;

  select * into v_profile from public.profiles where id = v_actor_id;
  if nullif(trim(coalesce(v_profile.full_name, '')), '') is null
    or nullif(trim(coalesce(v_profile.email, '')), '') is null
    or nullif(trim(coalesce(v_profile.phone, '')), '') is null then
    raise exception 'complete_contact_details_required';
  end if;

  if exists (
    select 1 from public.memberships m
    where m.program_id = p_program_id
      and m.profile_id = v_actor_id
      and m.status = 'active'
      and m.current_period_end > now()
  ) then
    raise exception 'membership_already_active';
  end if;

  select * into v_request
  from public.manual_membership_requests r
  where r.program_id = p_program_id
    and r.profile_id = v_actor_id
    and r.status = 'pending'
  limit 1;
  if found then return v_request; end if;

  insert into public.manual_membership_requests (
    program_id, profile_id, request_kind, requested_tier, member_note
  ) values (
    p_program_id, v_actor_id, 'enrollment', p_tier, trim(coalesce(p_member_note, ''))
  ) returning * into v_request;

  insert into public.manual_membership_events (
    request_id, program_id, profile_id, actor_profile_id, event_type,
    tier, from_status, to_status, reason
  ) values (
    v_request.id, p_program_id, v_actor_id, v_actor_id, 'requested',
    p_tier, null, 'pending', trim(coalesce(p_member_note, ''))
  );

  return v_request;
end;
$$;

create or replace function public.request_manual_membership_cancellation(
  p_program_id uuid,
  p_reason text
)
returns public.manual_membership_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_membership public.memberships%rowtype;
  v_request public.manual_membership_requests%rowtype;
begin
  if v_actor_id is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'cancellation_reason_required';
  end if;

  select * into v_membership
  from public.memberships m
  where m.program_id = p_program_id
    and m.profile_id = v_actor_id
    and m.provider = 'manual'
    and m.status = 'active'
  for update;
  if not found then raise exception 'active_manual_membership_required'; end if;

  select * into v_request
  from public.manual_membership_requests r
  where r.program_id = p_program_id
    and r.profile_id = v_actor_id
    and r.status = 'pending'
  limit 1;
  if found then return v_request; end if;

  insert into public.manual_membership_requests (
    program_id, profile_id, request_kind, requested_tier, member_note
  ) values (
    p_program_id, v_actor_id, 'cancellation', v_membership.tier, trim(p_reason)
  ) returning * into v_request;

  insert into public.manual_membership_events (
    request_id, program_id, profile_id, actor_profile_id, event_type,
    tier, from_status, to_status, reason
  ) values (
    v_request.id, p_program_id, v_actor_id, v_actor_id, 'requested',
    v_membership.tier, 'active', 'pending', trim(p_reason)
  );

  return v_request;
end;
$$;

create or replace function public.cancel_manual_membership_request(
  p_request_id uuid,
  p_reason text default ''
)
returns public.manual_membership_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_request public.manual_membership_requests%rowtype;
begin
  if v_actor_id is null then raise exception 'authentication_required'; end if;
  if char_length(trim(coalesce(p_reason, ''))) > 1000 then
    raise exception 'cancellation_reason_too_long';
  end if;

  select * into v_request
  from public.manual_membership_requests r
  where r.id = p_request_id
    and r.profile_id = v_actor_id
    and r.status = 'pending'
  for update;
  if not found then raise exception 'pending_request_not_found'; end if;

  update public.manual_membership_requests
  set status = 'canceled',
      canceled_at = now(),
      member_note = case
        when nullif(trim(coalesce(p_reason, '')), '') is null then member_note
        else concat_ws(E'\n', nullif(member_note, ''), 'Cancellation: ' || trim(p_reason))
      end
  where id = v_request.id
  returning * into v_request;

  insert into public.manual_membership_events (
    request_id, program_id, profile_id, actor_profile_id, event_type,
    tier, from_status, to_status, reason
  ) values (
    v_request.id, v_request.program_id, v_actor_id, v_actor_id, 'request_canceled',
    v_request.requested_tier, 'pending', 'canceled', trim(coalesce(p_reason, ''))
  );

  return v_request;
end;
$$;

create or replace function public.review_manual_membership_request(
  p_request_id uuid,
  p_decision text,
  p_reviewer_note text,
  p_effective_until timestamptz default null
)
returns public.manual_membership_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_request public.manual_membership_requests%rowtype;
  v_next_status public.manual_membership_request_status;
  v_period_end timestamptz;
  v_price_cents integer;
begin
  if v_actor_id is null or not public.is_platform_admin() then
    raise exception 'platform_admin_required';
  end if;
  if p_decision not in ('approve', 'reject') then raise exception 'invalid_review_decision'; end if;
  if char_length(trim(coalesce(p_reviewer_note, ''))) < 3 then raise exception 'review_note_required'; end if;
  if char_length(trim(p_reviewer_note)) > 2000 then raise exception 'review_note_too_long'; end if;

  select * into v_request
  from public.manual_membership_requests r
  where r.id = p_request_id and r.status = 'pending'
  for update;
  if not found then raise exception 'pending_request_not_found'; end if;

  v_next_status := case
    when p_decision = 'approve' then 'approved'::public.manual_membership_request_status
    else 'rejected'::public.manual_membership_request_status
  end;

  if p_decision = 'approve' and v_request.request_kind = 'enrollment' then
    v_period_end := coalesce(
      p_effective_until,
      now() + case when v_request.requested_tier = 'gold' then interval '1 year' else interval '1 month' end
    );
    if v_period_end <= now() or v_period_end > now() + interval '2 years' then
      raise exception 'invalid_membership_end_date';
    end if;
    v_price_cents := case when v_request.requested_tier = 'gold' then 10000 else 2500 end;

    insert into public.memberships (
      program_id, profile_id, status, current_period_start, current_period_end,
      cancel_at_period_end, price_cents, currency, provider,
      provider_subscription_id, last_credit_at, tier, provider_status
    ) values (
      v_request.program_id, v_request.profile_id, 'active', now(), v_period_end,
      false, v_price_cents, 'USD', 'manual', null, null,
      v_request.requested_tier, 'active'
    )
    on conflict (program_id, profile_id) do update
    set status = 'active',
        current_period_start = now(),
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = false,
        price_cents = excluded.price_cents,
        currency = excluded.currency,
        provider = 'manual',
        provider_subscription_id = null,
        last_credit_at = null,
        tier = excluded.tier,
        provider_status = 'active',
        updated_at = now();
  elsif p_decision = 'approve' and v_request.request_kind = 'cancellation' then
    update public.memberships
    set status = 'canceled',
        current_period_end = least(current_period_end, now()),
        cancel_at_period_end = false,
        provider_status = 'canceled',
        updated_at = now()
    where program_id = v_request.program_id
      and profile_id = v_request.profile_id
      and provider = 'manual'
      and status = 'active';
    if not found then raise exception 'active_manual_membership_required'; end if;
  end if;

  update public.manual_membership_requests
  set status = v_next_status,
      reviewer_note = trim(p_reviewer_note),
      reviewed_by = v_actor_id,
      reviewed_at = now()
  where id = v_request.id
  returning * into v_request;

  insert into public.manual_membership_events (
    request_id, program_id, profile_id, actor_profile_id, event_type,
    tier, from_status, to_status, reason
  ) values (
    v_request.id, v_request.program_id, v_request.profile_id, v_actor_id,
    case when p_decision = 'approve' then 'approved' else 'rejected' end,
    v_request.requested_tier, 'pending', v_next_status::text, trim(p_reviewer_note)
  );

  if p_decision = 'approve' and v_request.request_kind = 'cancellation' then
    insert into public.manual_membership_events (
      request_id, program_id, profile_id, actor_profile_id, event_type,
      tier, from_status, to_status, reason
    ) values (
      v_request.id, v_request.program_id, v_request.profile_id, v_actor_id,
      'membership_canceled', v_request.requested_tier, 'active', 'canceled',
      trim(p_reviewer_note)
    );
  end if;

  return v_request;
end;
$$;

create or replace function public.renew_manual_membership(
  p_program_id uuid,
  p_profile_id uuid,
  p_reviewer_note text,
  p_effective_until timestamptz default null
)
returns public.memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_membership public.memberships%rowtype;
  v_request_id uuid;
  v_period_end timestamptz;
begin
  if v_actor_id is null or not public.is_platform_admin() then raise exception 'platform_admin_required'; end if;
  if char_length(trim(coalesce(p_reviewer_note, ''))) < 3 then raise exception 'renewal_note_required'; end if;
  if char_length(trim(p_reviewer_note)) > 2000 then raise exception 'renewal_note_too_long'; end if;

  select * into v_membership
  from public.memberships m
  where m.program_id = p_program_id
    and m.profile_id = p_profile_id
    and m.provider = 'manual'
    and m.status = 'active'
  for update;
  if not found then raise exception 'active_manual_membership_required'; end if;

  v_period_end := coalesce(
    p_effective_until,
    greatest(v_membership.current_period_end, now())
      + case when v_membership.tier = 'gold' then interval '1 year' else interval '1 month' end
  );
  if v_period_end <= v_membership.current_period_end or v_period_end > now() + interval '2 years' then
    raise exception 'invalid_membership_end_date';
  end if;

  update public.memberships
  set current_period_end = v_period_end,
      provider_status = 'active',
      updated_at = now()
  where id = v_membership.id
  returning * into v_membership;

  select r.id into v_request_id
  from public.manual_membership_requests r
  where r.program_id = p_program_id
    and r.profile_id = p_profile_id
    and r.status = 'approved'
  order by r.reviewed_at desc nulls last
  limit 1;

  insert into public.manual_membership_events (
    request_id, program_id, profile_id, actor_profile_id, event_type,
    tier, from_status, to_status, reason
  ) values (
    v_request_id, p_program_id, p_profile_id, v_actor_id, 'membership_renewed',
    v_membership.tier, 'active', 'active', trim(p_reviewer_note)
  );

  return v_membership;
end;
$$;

create or replace function public.cancel_manual_membership(
  p_program_id uuid,
  p_profile_id uuid,
  p_reason text
)
returns public.memberships
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_membership public.memberships%rowtype;
  v_request_id uuid;
begin
  if v_actor_id is null or not public.is_platform_admin() then raise exception 'platform_admin_required'; end if;
  if char_length(trim(coalesce(p_reason, ''))) < 3 then raise exception 'cancellation_reason_required'; end if;
  if char_length(trim(p_reason)) > 2000 then raise exception 'cancellation_reason_too_long'; end if;

  update public.memberships
  set status = 'canceled',
      current_period_end = least(current_period_end, now()),
      cancel_at_period_end = false,
      provider_status = 'canceled',
      updated_at = now()
  where program_id = p_program_id
    and profile_id = p_profile_id
    and provider = 'manual'
    and status = 'active'
  returning * into v_membership;
  if not found then raise exception 'active_manual_membership_required'; end if;

  select r.id into v_request_id
  from public.manual_membership_requests r
  where r.program_id = p_program_id
    and r.profile_id = p_profile_id
    and r.status = 'approved'
  order by r.reviewed_at desc nulls last
  limit 1;

  insert into public.manual_membership_events (
    request_id, program_id, profile_id, actor_profile_id, event_type,
    tier, from_status, to_status, reason
  ) values (
    v_request_id, p_program_id, p_profile_id, v_actor_id, 'membership_canceled',
    v_membership.tier, 'active', 'canceled', trim(p_reason)
  );

  return v_membership;
end;
$$;

create or replace function public.get_manual_membership_requests()
returns table (
  request_id uuid,
  program_id uuid,
  program_name text,
  program_slug text,
  profile_id uuid,
  member_name text,
  member_email text,
  member_phone text,
  request_kind text,
  requested_tier text,
  request_status public.manual_membership_request_status,
  member_note text,
  reviewer_note text,
  requested_at timestamptz,
  reviewed_at timestamptz,
  membership_status public.membership_status,
  membership_tier text,
  membership_end timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_platform_admin() then raise exception 'platform_admin_required'; end if;
  return query
  select
    r.id,
    r.program_id,
    p.name,
    p.slug,
    r.profile_id,
    coalesce(pr.full_name, 'RewardMe member'),
    coalesce(pr.email, ''),
    coalesce(pr.phone, ''),
    r.request_kind,
    r.requested_tier,
    r.status,
    r.member_note,
    r.reviewer_note,
    r.requested_at,
    r.reviewed_at,
    m.status,
    m.tier,
    m.current_period_end
  from public.manual_membership_requests r
  join public.programs p on p.id = r.program_id
  join public.profiles pr on pr.id = r.profile_id
  left join public.memberships m
    on m.program_id = r.program_id and m.profile_id = r.profile_id
  order by
    case when r.status = 'pending' then 0 else 1 end,
    r.requested_at desc;
end;
$$;

revoke all on function public.request_manual_membership(uuid, text, text) from public, anon;
revoke all on function public.request_manual_membership_cancellation(uuid, text) from public, anon;
revoke all on function public.cancel_manual_membership_request(uuid, text) from public, anon;
revoke all on function public.review_manual_membership_request(uuid, text, text, timestamptz) from public, anon;
revoke all on function public.renew_manual_membership(uuid, uuid, text, timestamptz) from public, anon;
revoke all on function public.cancel_manual_membership(uuid, uuid, text) from public, anon;
revoke all on function public.get_manual_membership_requests() from public, anon;

grant execute on function public.request_manual_membership(uuid, text, text) to authenticated;
grant execute on function public.request_manual_membership_cancellation(uuid, text) to authenticated;
grant execute on function public.cancel_manual_membership_request(uuid, text) to authenticated;
grant execute on function public.review_manual_membership_request(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.renew_manual_membership(uuid, uuid, text, timestamptz) to authenticated;
grant execute on function public.cancel_manual_membership(uuid, uuid, text) to authenticated;
grant execute on function public.get_manual_membership_requests() to authenticated;

-- Savings stays read-only when the optional foundation is present. Production
-- projects that have not installed that foundation still retain the feature-off
-- program flag below.
do $$
begin
  if to_regclass('public.savings_goals') is not null then
    execute 'drop policy if exists "members create own enabled savings goals" on public.savings_goals';
    execute 'drop policy if exists "members update own enabled savings goals" on public.savings_goals';
    execute 'revoke insert, update, delete on table public.savings_goals from anon, authenticated';
    execute 'grant select on table public.savings_goals to authenticated';
  end if;

  if to_regclass('public.savings_ledger_entries') is not null then
    execute 'revoke insert, update, delete on table public.savings_ledger_entries from anon, authenticated';
    execute 'grant select on table public.savings_ledger_entries to authenticated';
  end if;
end;
$$;

update public.programs
set feature_flags = feature_flags || '{"savingsPlans":false}'::jsonb,
    updated_at = now()
where slug = 'pinas';
