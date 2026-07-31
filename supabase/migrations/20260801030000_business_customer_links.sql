-- Customers are global identities and can legitimately interact with more than
-- one business. Keep profiles.registered_by_business_id as immutable original
-- attribution while storing the current many-to-many relationship here.

create unique index if not exists businesses_id_program_id_key
  on public.businesses (id, program_id);

-- Explicit program-scoped writes must not be replaced by the customer's
-- original tenant metadata. Removing the compatibility default lets the
-- existing trigger distinguish an omitted legacy program from an explicit one.
alter table public.reward_balances
  alter column program_id drop default;

create or replace function public.assign_new_balance_to_program()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.program_id is not null then
    return new;
  end if;

  select coalesce(
    nullif(u.raw_user_meta_data ->> 'active_program_id', '')::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid
  )
    into new.program_id
  from auth.users u
  where u.id = new.profile_id;

  new.program_id := coalesce(
    new.program_id,
    '10000000-0000-4000-8000-000000000001'::uuid
  );
  return new;
end;
$$;

create table if not exists public.business_customer_links (
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  linked_by uuid references public.profiles(id) on delete set null,
  source text not null default 'registration'
    check (source in ('registration', 'order', 'transaction', 'legacy-attribution')),
  created_at timestamptz not null default now(),
  primary key (program_id, business_id, profile_id),
  constraint business_customer_links_business_program_fkey
    foreign key (business_id, program_id)
    references public.businesses(id, program_id)
    on delete cascade
);

create index if not exists idx_business_customer_links_profile_program
  on public.business_customer_links (profile_id, program_id);
create index if not exists idx_business_customer_links_business_created
  on public.business_customer_links (business_id, created_at desc);

-- Enforce tenant membership independently of API callers and RLS. Even a
-- privileged program administrator cannot attach a global identity that is not
-- an active customer in this exact program.
create or replace function public.validate_business_customer_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.profiles p
    join public.program_memberships pm
      on pm.profile_id = p.id
     and pm.program_id = new.program_id
     and pm.role = 'member'
     and pm.status = 'active'
    where p.id = new.profile_id
      and p.role::text = 'customer'
  ) then
    raise exception 'active_program_customer_required';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_business_customer_link() from public;

drop trigger if exists validate_business_customer_link on public.business_customer_links;
create trigger validate_business_customer_link
  before insert or update on public.business_customer_links
  for each row execute function public.validate_business_customer_link();

alter table public.business_customer_links enable row level security;

drop policy if exists "members read own business links" on public.business_customer_links;
create policy "members read own business links"
  on public.business_customer_links for select to authenticated
  using (profile_id = auth.uid());

drop policy if exists "business teams read their customer links" on public.business_customer_links;
create policy "business teams read their customer links"
  on public.business_customer_links for select to authenticated
  using (
    public.has_staff_access()
    and business_id = public.current_business_id()
    and public.is_program_member(
      program_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
  );

drop policy if exists "business teams create their customer links" on public.business_customer_links;
create policy "business teams create their customer links"
  on public.business_customer_links for insert to authenticated
  with check (
    public.has_staff_access()
    and business_id = public.current_business_id()
    and public.is_program_member(
      program_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
    and exists (
      select 1
      from public.program_memberships pm
      where pm.program_id = business_customer_links.program_id
        and pm.profile_id = business_customer_links.profile_id
        and pm.role = 'member'
        and pm.status = 'active'
    )
  );

drop policy if exists "program admins manage business customer links" on public.business_customer_links;
create policy "program admins manage business customer links"
  on public.business_customer_links for all to authenticated
  using (
    public.is_platform_admin()
    or public.is_program_member(program_id, array['program-admin']::public.program_role[])
  )
  with check (
    public.is_platform_admin()
    or public.is_program_member(program_id, array['program-admin']::public.program_role[])
  );

revoke all on table public.business_customer_links from anon;
revoke update on table public.business_customer_links from authenticated;
grant select, insert, delete on table public.business_customer_links to authenticated;
grant all on table public.business_customer_links to service_role;

-- Backfill only relationships whose customer has an active member identity in
-- the business's program. This prevents old cross-tenant data from becoming a
-- newly visible customer link.
insert into public.business_customer_links (
  program_id,
  business_id,
  profile_id,
  source
)
select
  b.program_id,
  b.id,
  p.id,
  'legacy-attribution'
from public.profiles p
join public.businesses b on b.id = p.registered_by_business_id
join public.program_memberships pm
  on pm.program_id = b.program_id
 and pm.profile_id = p.id
 and pm.role = 'member'
 and pm.status = 'active'
where p.role::text = 'customer'
on conflict (program_id, business_id, profile_id) do nothing;

insert into public.business_customer_links (
  program_id,
  business_id,
  profile_id,
  source
)
select distinct
  b.program_id,
  b.id,
  p.id,
  'order'
from public.orders o
join public.businesses b on b.id = o.business_id
join public.profiles p on p.id = o.profile_id and p.role::text = 'customer'
join public.program_memberships pm
  on pm.program_id = b.program_id
 and pm.profile_id = p.id
 and pm.role = 'member'
 and pm.status = 'active'
on conflict (program_id, business_id, profile_id) do nothing;

insert into public.business_customer_links (
  program_id,
  business_id,
  profile_id,
  source
)
select distinct
  b.program_id,
  b.id,
  p.id,
  'transaction'
from public.member_transactions mt
join public.businesses b on b.id = mt.business_id
join public.profiles p on p.id = mt.profile_id and p.role::text = 'customer'
join public.program_memberships pm
  on pm.program_id = b.program_id
 and pm.profile_id = p.id
 and pm.role = 'member'
 and pm.status = 'active'
on conflict (program_id, business_id, profile_id) do nothing;

-- Keep the relationship current even when a customer first reaches a business
-- through checkout or an in-person member transaction instead of registration.
create or replace function public.sync_business_customer_link_from_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
begin
  select b.program_id
    into v_program_id
  from public.businesses b
  where b.id = new.business_id;

  if v_program_id is null then
    return new;
  end if;

  insert into public.business_customer_links (
    program_id,
    business_id,
    profile_id,
    source
  )
  select
    v_program_id,
    new.business_id,
    new.profile_id,
    tg_argv[0]
  from public.profiles p
  where p.id = new.profile_id
    and p.role::text = 'customer'
    and exists (
      select 1
      from public.program_memberships pm
      where pm.program_id = v_program_id
        and pm.profile_id = p.id
        and pm.role = 'member'
        and pm.status = 'active'
    )
  on conflict (program_id, business_id, profile_id) do nothing;

  return new;
end;
$$;

revoke all on function public.sync_business_customer_link_from_activity() from public;

drop trigger if exists sync_order_business_customer_link on public.orders;
create trigger sync_order_business_customer_link
  after insert or update of business_id, profile_id on public.orders
  for each row execute function public.sync_business_customer_link_from_activity('order');

drop trigger if exists sync_transaction_business_customer_link on public.member_transactions;
create trigger sync_transaction_business_customer_link
  after insert or update of business_id, profile_id on public.member_transactions
  for each row execute function public.sync_business_customer_link_from_activity('transaction');

-- The UI reads customers through this program-derived RPC instead of selecting
-- every profile and filtering client-side. That keeps names, emails, and balances
-- inaccessible to staff from another business or program.
create or replace function public.get_business_customers(p_business_id uuid)
returns table (
  id uuid,
  full_name text,
  email text,
  points integer,
  verification_status text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;

  select b.program_id
    into v_program_id
  from public.businesses b
  where b.id = p_business_id;

  if v_program_id is null then
    raise exception 'business_not_found';
  end if;

  if not public.is_platform_admin()
    and not (
      public.has_staff_access()
      and public.current_business_id() = p_business_id
      and public.is_program_member(
        v_program_id,
        array['business-owner', 'business-staff']::public.program_role[]
      )
    )
    and not public.is_program_member(
      v_program_id,
      array['program-admin']::public.program_role[]
    )
  then
    raise exception 'permission_denied';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    coalesce(rb.points, 0),
    p.verification_status::text
  from public.business_customer_links link
  join public.profiles p
    on p.id = link.profile_id
   and p.role::text = 'customer'
  join public.program_memberships pm
    on pm.program_id = link.program_id
   and pm.profile_id = link.profile_id
   and pm.role = 'member'
   and pm.status = 'active'
  left join public.reward_balances rb
    on rb.program_id = link.program_id
   and rb.profile_id = link.profile_id
  where link.program_id = v_program_id
    and link.business_id = p_business_id
  order by p.full_name, p.id;
end;
$$;

revoke all on function public.get_business_customers(uuid) from public;
grant execute on function public.get_business_customers(uuid) to authenticated;

-- Preserve direct-table compatibility for older clients while adding linked
-- customers to the existing visibility policies.
drop policy if exists "Business owners can view profiles for their business" on public.profiles;
create policy "Business owners can view profiles for their business"
  on public.profiles for select
  using (
    public.is_business_owner()
    and (
      id = auth.uid()
      or exists (
        select 1
        from public.orders o
        where o.profile_id = profiles.id
          and o.business_id = public.current_business_id()
      )
      or registered_by_business_id = public.current_business_id()
      or exists (
        select 1
        from public.business_customer_links link
        where link.profile_id = profiles.id
          and link.business_id = public.current_business_id()
      )
    )
  );

drop policy if exists "Business owners can view customer balances" on public.reward_balances;
create policy "Business owners can view customer balances"
  on public.reward_balances for select
  using (
    public.is_business_owner()
    and exists (
      select 1
      from public.business_customer_links link
      where link.profile_id = reward_balances.profile_id
        and link.program_id = reward_balances.program_id
        and link.business_id = public.current_business_id()
    )
  );

-- Awarding points is part of the same customer relationship. Replace the old
-- singleton profiles.business_id authorization with the program-scoped link.
create or replace function public.adjust_member_points(
  p_profile_id uuid,
  p_delta integer,
  p_reason text,
  p_business_id uuid default null
)
returns public.reward_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor public.profiles%rowtype;
  v_target public.profiles%rowtype;
  v_program_id uuid;
  v_balance public.reward_balances%rowtype;
  v_updated_balance public.reward_balances%rowtype;
  v_actual_delta integer;
begin
  if v_actor_id is null then
    raise exception 'authentication_required';
  end if;

  if nullif(trim(coalesce(p_reason, '')), '') is null then
    raise exception 'adjustment_reason_required';
  end if;

  if p_delta is null then
    raise exception 'adjustment_value_required';
  end if;

  select * into v_actor
  from public.profiles
  where id = v_actor_id;

  if not found then
    raise exception 'permission_denied';
  end if;

  select * into v_target
  from public.profiles
  where id = p_profile_id
    and role::text = 'customer';

  if not found then
    raise exception 'member_not_found';
  end if;

  if p_business_id is not null then
    select b.program_id into v_program_id
    from public.businesses b
    where b.id = p_business_id
      and b.active;
  elsif v_actor.role::text = 'platform-admin' then
    -- Retain the legacy global-admin action when it has no business context,
    -- choosing an active member program deterministically.
    select pm.program_id into v_program_id
    from public.program_memberships pm
    where pm.profile_id = p_profile_id
      and pm.role = 'member'
      and pm.status = 'active'
    order by pm.created_at, pm.program_id
    limit 1;
  end if;

  if v_program_id is null then
    raise exception 'business_context_required';
  end if;

  if v_actor.role::text <> 'platform-admin' then
    if not public.has_staff_access()
      or v_actor.business_id is null
      or v_actor.business_id is distinct from p_business_id
      or not exists (
        select 1
        from public.program_memberships actor_pm
        where actor_pm.program_id = v_program_id
          and actor_pm.profile_id = v_actor_id
          and actor_pm.business_id = p_business_id
          and actor_pm.role in ('business-owner', 'business-staff')
          and actor_pm.status = 'active'
      )
    then
      raise exception 'permission_denied';
    end if;
  end if;

  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = v_program_id
      and pm.profile_id = p_profile_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'active_program_membership_required';
  end if;

  if p_business_id is not null and not exists (
    select 1
    from public.business_customer_links link
    where link.program_id = v_program_id
      and link.business_id = p_business_id
      and link.profile_id = p_profile_id
  ) then
    raise exception 'business_customer_link_required';
  end if;

  insert into public.reward_balances (program_id, profile_id)
  values (v_program_id, p_profile_id)
  on conflict (program_id, profile_id) do nothing;

  select * into v_balance
  from public.reward_balances rb
  where rb.program_id = v_program_id
    and rb.profile_id = p_profile_id
  for update;

  if not found then
    raise exception 'program_balance_unavailable';
  end if;

  update public.reward_balances rb
  set points = greatest(0, v_balance.points + p_delta),
      updated_at = now()
  where rb.program_id = v_program_id
    and rb.profile_id = p_profile_id
  returning * into v_updated_balance;

  v_actual_delta := v_updated_balance.points - v_balance.points;

  insert into public.activities (
    program_id,
    profile_id,
    business_id,
    type,
    title,
    description,
    points,
    status
  )
  values (
    v_program_id,
    p_profile_id,
    p_business_id,
    'adjustment',
    case when v_actual_delta >= 0 then 'XP added by staff' else 'XP deducted by staff' end,
    trim(p_reason),
    v_actual_delta,
    'posted'
  );

  insert into public.admin_logs (
    program_id,
    actor_id,
    actor_name,
    action,
    details
  )
  values (
    v_program_id,
    v_actor_id,
    coalesce(v_actor.full_name, 'Staff'),
    'XP Adjustment',
    format(
      '%s %s XP for member %s. Reason: %s',
      case when v_actual_delta >= 0 then 'Added' else 'Deducted' end,
      abs(v_actual_delta),
      p_profile_id,
      trim(p_reason)
    )
  );

  return v_updated_balance;
end;
$$;

revoke all on function public.adjust_member_points(uuid, integer, text, uuid) from public;
grant execute on function public.adjust_member_points(uuid, integer, text, uuid) to authenticated;

notify pgrst, 'reload schema';
