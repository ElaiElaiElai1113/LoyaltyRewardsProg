create or replace function public.issue_gift_card(
  p_catalog_id uuid,
  p_customer_id uuid
)
returns public.gift_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  catalog_row public.gift_card_catalog%rowtype;
  customer_profile public.profiles%rowtype;
  balance_row public.reward_balances%rowtype;
  next_card public.gift_cards%rowtype;
  next_token text;
  remaining_points integer;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select * into actor_profile from public.profiles where id = actor_id;
  if not found then raise exception 'Issuing profile not found'; end if;

  select * into customer_profile from public.profiles where id = p_customer_id;
  if not found then raise exception 'Customer not found'; end if;
  if customer_profile.role <> 'customer' then raise exception 'Gift cards can only be issued to customers'; end if;

  select * into catalog_row
  from public.gift_card_catalog
  where id = p_catalog_id
    and is_active = true;
  if not found then raise exception 'Gift card catalog item is not active'; end if;

  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = catalog_row.program_id
      and pm.profile_id = p_customer_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'Customer is not an active member of this rewards program';
  end if;

  if actor_profile.role = 'customer' and actor_id <> p_customer_id then
    raise exception 'Customers can only issue gift cards for themselves';
  end if;

  if actor_profile.role = 'business-owner' and (
    actor_profile.business_id is null
    or actor_profile.business_id <> catalog_row.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  if actor_profile.role not in ('customer', 'platform-admin', 'business-owner') then
    raise exception 'Permission denied';
  end if;

  insert into public.reward_balances (program_id, profile_id)
  values (catalog_row.program_id, p_customer_id)
  on conflict (program_id, profile_id) do nothing;

  select * into balance_row
  from public.reward_balances
  where program_id = catalog_row.program_id
    and profile_id = p_customer_id
  for update;

  if balance_row.points < catalog_row.points_cost then
    raise exception 'Insufficient points';
  end if;

  update public.reward_balances
  set points = points - catalog_row.points_cost,
      updated_at = now()
  where program_id = catalog_row.program_id
    and profile_id = p_customer_id
    and points >= catalog_row.points_cost
  returning points into remaining_points;

  if not found then raise exception 'Insufficient points'; end if;

  loop
    next_token := public.generate_secure_token(16);
    begin
      insert into public.gift_cards (
        program_id,
        catalog_id,
        business_id,
        customer_id,
        issued_by,
        code,
        public_token,
        status,
        points_spent,
        expires_at
      )
      values (
        catalog_row.program_id,
        catalog_row.id,
        catalog_row.business_id,
        p_customer_id,
        actor_id,
        public.generate_gift_card_code(),
        next_token,
        'active',
        catalog_row.points_cost,
        now() + make_interval(days => catalog_row.expiry_days)
      )
      returning * into next_card;
      exit;
    exception
      when unique_violation then continue;
    end;
  end loop;

  insert into public.gift_card_events (program_id, gift_card_id, event_type, actor_id, metadata)
  values (
    catalog_row.program_id,
    next_card.id,
    'issued',
    actor_id,
    jsonb_build_object(
      'catalog_id', catalog_row.id,
      'business_id', catalog_row.business_id,
      'points_spent', catalog_row.points_cost,
      'remaining_points', remaining_points
    )
  );

  insert into public.activities (program_id, profile_id, business_id, type, title, description, points, status)
  values (
    catalog_row.program_id,
    p_customer_id,
    catalog_row.business_id,
    'gift_card_issued',
    'Gift card issued',
    catalog_row.title,
    -catalog_row.points_cost,
    'posted'
  );

  return next_card;
end;
$$;

revoke all on function public.issue_gift_card(uuid, uuid) from public;
grant execute on function public.issue_gift_card(uuid, uuid) to authenticated;
