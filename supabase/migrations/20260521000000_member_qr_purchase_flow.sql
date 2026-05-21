create or replace function public.resolve_member_for_business_scan(
  p_member_code text,
  p_business_id uuid
)
returns table (
  id uuid,
  full_name text,
  email text,
  referral_code text,
  verification_status text,
  points integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  normalized_code text := upper(
    regexp_replace(
      regexp_replace(trim(coalesce(p_member_code, '')), '^MRMEM:', '', 'i'),
      '^https?://[^/]+/member/(.+)$',
      '\1',
      'i'
    )
  );
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id is distinct from p_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  if nullif(normalized_code, '') is null then
    raise exception 'Member code is required.';
  end if;

  return query
  select
    profile_row.id,
    profile_row.full_name,
    profile_row.email,
    profile_row.referral_code,
    coalesce(profile_row.verification_status::text, 'not_submitted'),
    coalesce(balance_row.points, 0)::integer
  from public.profiles profile_row
  left join public.reward_balances balance_row on balance_row.profile_id = profile_row.id
  where profile_row.role = 'customer'
    and (
      upper(profile_row.referral_code) = normalized_code
      or profile_row.id::text = normalized_code
    )
  limit 1;

  if not found then
    raise exception 'Member not found.';
  end if;
end;
$$;

create or replace function public.record_business_member_purchase(
  p_member_code text,
  p_amount numeric,
  p_business_id uuid,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  target_profile public.profiles%rowtype;
  inserted_order public.orders%rowtype;
  updated_balance public.reward_balances%rowtype;
  actor_name text;
  normalized_code text := upper(
    regexp_replace(
      regexp_replace(trim(coalesce(p_member_code, '')), '^MRMEM:', '', 'i'),
      '^https?://[^/]+/member/(.+)$',
      '\1',
      'i'
    )
  );
  subtotal_value numeric(12,2);
  tax_value numeric(12,2);
  total_value numeric(12,2);
  points_earned_value integer;
  reason_text text;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = actor_id;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id is distinct from p_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  if nullif(normalized_code, '') is null then
    raise exception 'Member code is required.';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Purchase amount must be greater than zero.';
  end if;

  select *
    into business_row
  from public.businesses
  where id = p_business_id
    and active = true
  for share;

  if not found then
    raise exception 'Business not found.';
  end if;

  select *
    into target_profile
  from public.profiles
  where role = 'customer'
    and (
      upper(referral_code) = normalized_code
      or id::text = normalized_code
    )
  limit 1;

  if not found then
    raise exception 'Member not found.';
  end if;

  if coalesce(target_profile.verification_status::text, 'not_submitted') <> 'verified' then
    raise exception 'ID verification is required before a member can earn rewards.';
  end if;

  subtotal_value := round(p_amount::numeric, 2);
  tax_value := 0;
  total_value := subtotal_value;
  points_earned_value := floor(total_value * business_row.earn_rate);

  insert into public.orders (
    profile_id,
    business_id,
    subtotal,
    tax,
    total,
    points_earned,
    points_status,
    payment_method,
    status
  )
  values (
    target_profile.id,
    p_business_id,
    subtotal_value,
    tax_value,
    total_value,
    points_earned_value,
    'posted',
    'in_store_manual',
    'confirmed'
  )
  returning *
    into inserted_order;

  insert into public.reward_balances (profile_id)
  values (target_profile.id)
  on conflict (profile_id) do nothing;

  update public.reward_balances
  set points = points + points_earned_value
  where profile_id = target_profile.id
  returning *
    into updated_balance;

  reason_text := coalesce(
    nullif(trim(p_note), ''),
    format('In-store purchase recorded by staff for $%s.', to_char(total_value, 'FM999999990.00'))
  );

  insert into public.activities (
    profile_id,
    business_id,
    type,
    title,
    description,
    points,
    status
  )
  values (
    target_profile.id,
    p_business_id,
    'earned',
    format('Purchase at %s - $%s', business_row.name, to_char(total_value, 'FM999999990.00')),
    format('%s %s XP earned.', reason_text, points_earned_value),
    points_earned_value,
    'posted'
  );

  select full_name
    into actor_name
  from public.profiles
  where id = actor_id;

  insert into public.admin_logs (
    actor_id,
    actor_name,
    action,
    details
  )
  values (
    actor_id,
    coalesce(actor_name, 'Staff'),
    'In-store member purchase recorded',
    format(
      'Business %s recorded $%s for member %s and awarded %s XP. Note: %s',
      business_row.name,
      to_char(total_value, 'FM999999990.00'),
      target_profile.id,
      points_earned_value,
      reason_text
    )
  );

  return inserted_order;
end;
$$;

revoke all on function public.resolve_member_for_business_scan(text, uuid) from public;
grant execute on function public.resolve_member_for_business_scan(text, uuid) to authenticated;

revoke all on function public.record_business_member_purchase(text, numeric, uuid, text) from public;
grant execute on function public.record_business_member_purchase(text, numeric, uuid, text) to authenticated;
