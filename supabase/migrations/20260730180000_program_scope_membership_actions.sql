create or replace function public.grant_program_membership_credit(
  p_program_id uuid,
  p_profile_id uuid,
  p_amount_cents integer
)
returns public.reward_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_balance public.reward_balances%rowtype;
begin
  if p_program_id is null or p_profile_id is null then
    raise exception 'program_and_profile_required';
  end if;

  if p_amount_cents <= 0 then
    raise exception 'amount_required';
  end if;

  insert into public.reward_balances (program_id, profile_id)
  values (p_program_id, p_profile_id)
  on conflict (program_id, profile_id) do nothing;

  update public.reward_balances
  set available_credits = available_credits + p_amount_cents
  where program_id = p_program_id
    and profile_id = p_profile_id
  returning * into updated_balance;

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
    p_program_id,
    p_profile_id,
    null,
    'bonus',
    'Monthly membership credit',
    'Monthly membership credit',
    0,
    'posted'
  );

  return updated_balance;
end;
$$;

create or replace function public.mock_subscribe(p_program_id uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_membership public.memberships%rowtype;
  membership_row public.memberships%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_program_member(p_program_id, array['member']::public.program_role[]) then
    raise exception 'program_membership_required';
  end if;

  select * into existing_membership
  from public.memberships
  where program_id = p_program_id
    and profile_id = actor_id
  for update;

  if found and existing_membership.status = 'active'
    and existing_membership.current_period_end > now() then
    return existing_membership;
  end if;

  insert into public.memberships (
    program_id,
    profile_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    price_cents,
    currency,
    provider,
    provider_subscription_id,
    last_credit_at
  )
  values (
    p_program_id,
    actor_id,
    'active',
    now(),
    now() + interval '30 days',
    false,
    2500,
    'USD',
    'mock',
    null,
    now()
  )
  on conflict (program_id, profile_id) do update
  set status = 'active',
      current_period_start = now(),
      current_period_end = now() + interval '30 days',
      cancel_at_period_end = false,
      price_cents = 2500,
      currency = 'USD',
      provider = 'mock',
      provider_subscription_id = null,
      last_credit_at = now()
  returning * into membership_row;

  perform public.grant_program_membership_credit(p_program_id, actor_id, 1000);
  return membership_row;
end;
$$;

create or replace function public.mock_renew(p_program_id uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  existing_membership public.memberships%rowtype;
  membership_row public.memberships%rowtype;
  period_base timestamptz;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_program_member(p_program_id, array['member']::public.program_role[]) then
    raise exception 'program_membership_required';
  end if;

  select * into existing_membership
  from public.memberships
  where program_id = p_program_id
    and profile_id = actor_id
  for update;

  if found and existing_membership.last_credit_at is not null
    and existing_membership.last_credit_at::date = now()::date then
    return existing_membership;
  end if;

  period_base := greatest(coalesce(existing_membership.current_period_end, now()), now());

  insert into public.memberships (
    program_id,
    profile_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    price_cents,
    currency,
    provider,
    provider_subscription_id,
    last_credit_at
  )
  values (
    p_program_id,
    actor_id,
    'active',
    now(),
    now() + interval '30 days',
    false,
    2500,
    'USD',
    'mock',
    null,
    now()
  )
  on conflict (program_id, profile_id) do update
  set status = 'active',
      current_period_start = case
        when public.memberships.current_period_end > now() then public.memberships.current_period_start
        else now()
      end,
      current_period_end = period_base + interval '30 days',
      cancel_at_period_end = false,
      price_cents = 2500,
      currency = 'USD',
      provider = 'mock',
      provider_subscription_id = null,
      last_credit_at = now()
  returning * into membership_row;

  perform public.grant_program_membership_credit(p_program_id, actor_id, 1000);
  return membership_row;
end;
$$;

create or replace function public.mock_cancel(p_program_id uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  membership_row public.memberships%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  update public.memberships
  set status = 'canceled',
      cancel_at_period_end = true,
      updated_at = now()
  where program_id = p_program_id
    and profile_id = actor_id
  returning * into membership_row;

  if not found then
    raise exception 'membership_not_found';
  end if;

  return membership_row;
end;
$$;

revoke all on function public.grant_program_membership_credit(uuid, uuid, integer) from public;
revoke all on function public.mock_subscribe(uuid) from public;
revoke all on function public.mock_renew(uuid) from public;
revoke all on function public.mock_cancel(uuid) from public;

grant execute on function public.mock_subscribe(uuid) to authenticated;
grant execute on function public.mock_renew(uuid) to authenticated;
grant execute on function public.mock_cancel(uuid) to authenticated;
