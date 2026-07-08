create or replace function public.gift_card_face_value_from_label(p_label text)
returns numeric
language sql
immutable
as $$
  select coalesce(
    nullif(replace(substring(coalesce(p_label, '') from '([0-9]+(?:[,.][0-9]+)*)'), ',', ''), '')::numeric,
    0
  );
$$;

alter table public.gift_cards
  add column if not exists initial_balance numeric(12,2),
  add column if not exists remaining_balance numeric(12,2);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'gift_cards_initial_balance_nonnegative'
      and conrelid = 'public.gift_cards'::regclass
  ) then
    alter table public.gift_cards
      add constraint gift_cards_initial_balance_nonnegative
      check (initial_balance is null or initial_balance >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gift_cards_remaining_balance_nonnegative'
      and conrelid = 'public.gift_cards'::regclass
  ) then
    alter table public.gift_cards
      add constraint gift_cards_remaining_balance_nonnegative
      check (remaining_balance is null or remaining_balance >= 0);
  end if;
end $$;

with parsed_values as (
  select
    gc.id,
    public.gift_card_face_value_from_label(gcc.value_label) as face_value
  from public.gift_cards gc
  left join public.gift_card_catalog gcc on gcc.id = gc.catalog_id
),
redemptions as (
  select
    gift_card_id,
    sum(coalesce(nullif(metadata ->> 'gift_card_amount', '')::numeric, 0)) as redeemed_amount
  from public.gift_card_events
  where event_type = 'redeemed'
  group by gift_card_id
)
update public.gift_cards gc
set initial_balance = coalesce(gc.initial_balance, parsed_values.face_value, 0),
    remaining_balance = case
      when gc.status = 'redeemed' then 0
      else greatest(coalesce(gc.remaining_balance, parsed_values.face_value, 0) - coalesce(redemptions.redeemed_amount, 0), 0)
    end
from parsed_values
left join redemptions on redemptions.gift_card_id = parsed_values.id
where gc.id = parsed_values.id
  and (gc.initial_balance is null or gc.remaining_balance is null);

update public.gift_cards
set status = 'redeemed',
    redeemed_at = coalesce(redeemed_at, now())
where status = 'active'
  and coalesce(remaining_balance, 0) <= 0;

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
  remaining_points integer := null;
  points_spent_value integer := 0;
  face_value numeric(12,2);
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

  if actor_profile.role = 'customer' and actor_id <> p_customer_id then
    raise exception 'Customers can only issue gift cards for themselves';
  end if;

  if actor_profile.role in ('business-owner', 'business-staff') and (
    actor_profile.business_id is null
    or actor_profile.business_id <> catalog_row.business_id
  ) then
    raise exception 'Permission denied';
  end if;

  if actor_profile.role not in ('customer', 'platform-admin', 'business-owner', 'business-staff') then
    raise exception 'Permission denied';
  end if;

  face_value := round(public.gift_card_face_value_from_label(catalog_row.value_label)::numeric, 2);

  if actor_profile.role = 'customer' then
    insert into public.reward_balances (profile_id)
    values (p_customer_id)
    on conflict (profile_id) do nothing;

    select * into balance_row
    from public.reward_balances
    where profile_id = p_customer_id
    for update;

    if balance_row.points < catalog_row.points_cost then
      raise exception 'Insufficient points';
    end if;

    update public.reward_balances
    set points = points - catalog_row.points_cost,
        updated_at = now()
    where profile_id = p_customer_id
      and points >= catalog_row.points_cost
    returning points into remaining_points;

    if not found then raise exception 'Insufficient points'; end if;
    points_spent_value := catalog_row.points_cost;
  end if;

  loop
    next_token := public.generate_secure_token(16);
    begin
      insert into public.gift_cards (
        catalog_id,
        business_id,
        customer_id,
        issued_by,
        code,
        public_token,
        status,
        points_spent,
        initial_balance,
        remaining_balance,
        expires_at
      )
      values (
        catalog_row.id,
        catalog_row.business_id,
        p_customer_id,
        actor_id,
        public.generate_gift_card_code(),
        next_token,
        'active',
        points_spent_value,
        face_value,
        face_value,
        now() + make_interval(days => catalog_row.expiry_days)
      )
      returning * into next_card;
      exit;
    exception
      when unique_violation then continue;
    end;
  end loop;

  insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
  values (
    next_card.id,
    'issued',
    actor_id,
    jsonb_build_object(
      'catalog_id', catalog_row.id,
      'business_id', catalog_row.business_id,
      'points_spent', points_spent_value,
      'remaining_points', remaining_points,
      'initial_balance', face_value,
      'remaining_balance', face_value
    )
  );

  insert into public.activities (profile_id, business_id, type, title, description, points, status)
  values (
    p_customer_id,
    catalog_row.business_id,
    'gift_card_issued',
    'Gift card issued',
    catalog_row.title,
    -points_spent_value,
    'posted'
  );

  return next_card;
end;
$$;

drop function if exists public.get_public_gift_card_by_token(text);
create or replace function public.get_public_gift_card_by_token(p_token text)
returns table (
  id uuid,
  catalog_id uuid,
  business_id uuid,
  customer_id uuid,
  code text,
  public_token text,
  status public.gift_card_status,
  points_spent integer,
  initial_balance numeric,
  remaining_balance numeric,
  expires_at timestamptz,
  redeemed_at timestamptz,
  business_name text,
  business_logo_url text,
  business_primary_color text,
  business_accent_color text,
  customer_first_name text,
  title text,
  description text,
  value_label text,
  image_url text
)
language sql
security definer
set search_path = public
as $$
  select
    gc.id,
    gc.catalog_id,
    gc.business_id,
    gc.customer_id,
    gc.code,
    gc.public_token,
    case
      when gc.status in ('redeemed', 'cancelled') then gc.status
      when gc.expires_at <= now() then 'expired'::public.gift_card_status
      when coalesce(gc.remaining_balance, public.gift_card_face_value_from_label(gcc.value_label), 0) <= 0 then 'redeemed'::public.gift_card_status
      else gc.status
    end,
    gc.points_spent,
    coalesce(gc.initial_balance, public.gift_card_face_value_from_label(gcc.value_label), 0),
    coalesce(gc.remaining_balance, public.gift_card_face_value_from_label(gcc.value_label), 0),
    gc.expires_at,
    gc.redeemed_at,
    b.name,
    b.logo_url,
    '#f4a84f'::text,
    '#7bd8cf'::text,
    split_part(coalesce(p.full_name, 'Member'), ' ', 1),
    coalesce(gcc.title, 'Gift card'),
    coalesce(gcc.description, ''),
    coalesce(gcc.value_label, ''),
    gcc.image_url
  from public.gift_cards gc
  join public.businesses b on b.id = gc.business_id
  join public.profiles p on p.id = gc.customer_id
  left join public.gift_card_catalog gcc on gcc.id = gc.catalog_id
  where gc.public_token = p_token
     or upper(gc.code) = upper(p_token)
  limit 1;
$$;

drop function if exists public.get_business_gift_cards(uuid);
create or replace function public.get_business_gift_cards(p_business_id uuid)
returns table (
  id uuid,
  catalog_id uuid,
  business_id uuid,
  customer_id uuid,
  issued_by uuid,
  code text,
  public_token text,
  status public.gift_card_status,
  points_spent integer,
  initial_balance numeric,
  remaining_balance numeric,
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by uuid,
  redeemed_at_business uuid,
  created_at timestamptz,
  updated_at timestamptz,
  catalog_title text,
  catalog_description text,
  catalog_value_label text,
  catalog_image_url text,
  business_name text,
  business_logo_url text,
  customer_first_name text,
  redemption_original_bill numeric,
  redemption_gift_card_amount numeric,
  redemption_receipt_number text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
begin
  if actor_id is null then
    raise exception 'Authentication required';
  end if;

  select * into actor_profile
  from public.profiles
  where profiles.id = actor_id;

  if not found then
    raise exception 'Business profile not found';
  end if;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id <> p_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  return query
  select
    gc.id,
    gc.catalog_id,
    gc.business_id,
    gc.customer_id,
    gc.issued_by,
    gc.code,
    gc.public_token,
    case
      when gc.status in ('redeemed', 'cancelled') then gc.status
      when gc.expires_at <= now() then 'expired'::public.gift_card_status
      when coalesce(gc.remaining_balance, public.gift_card_face_value_from_label(gcc.value_label), 0) <= 0 then 'redeemed'::public.gift_card_status
      else gc.status
    end as status,
    gc.points_spent,
    coalesce(gc.initial_balance, public.gift_card_face_value_from_label(gcc.value_label), 0) as initial_balance,
    coalesce(gc.remaining_balance, public.gift_card_face_value_from_label(gcc.value_label), 0) as remaining_balance,
    gc.expires_at,
    gc.redeemed_at,
    gc.redeemed_by,
    gc.redeemed_at_business,
    gc.created_at,
    gc.updated_at,
    coalesce(gcc.title, 'Gift card') as catalog_title,
    coalesce(gcc.description, '') as catalog_description,
    coalesce(gcc.value_label, '') as catalog_value_label,
    gcc.image_url as catalog_image_url,
    b.name as business_name,
    b.logo_url as business_logo_url,
    split_part(coalesce(customer.full_name, 'Member'), ' ', 1) as customer_first_name,
    nullif(latest_redemption.metadata ->> 'original_bill', '')::numeric as redemption_original_bill,
    nullif(latest_redemption.metadata ->> 'gift_card_amount', '')::numeric as redemption_gift_card_amount,
    nullif(latest_redemption.metadata ->> 'receipt_number', '') as redemption_receipt_number
  from public.gift_cards gc
  join public.businesses b on b.id = gc.business_id
  join public.profiles customer on customer.id = gc.customer_id
  left join public.gift_card_catalog gcc on gcc.id = gc.catalog_id
  left join lateral (
    select gce.metadata
    from public.gift_card_events gce
    where gce.gift_card_id = gc.id
      and gce.event_type = 'redeemed'
    order by gce.created_at desc
    limit 1
  ) latest_redemption on true
  where gc.business_id = p_business_id
  order by gc.created_at desc;
end;
$$;

revoke all on function public.get_business_gift_cards(uuid) from public;
grant execute on function public.get_business_gift_cards(uuid) to authenticated;

drop function if exists public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid);
create or replace function public.redeem_gift_card(
  p_gift_card_id uuid,
  p_business_id uuid,
  p_original_bill numeric default null,
  p_receipt_number text default null,
  p_gift_card_amount numeric default null,
  p_client_request_id uuid default null
)
returns public.gift_cards
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  card_row public.gift_cards%rowtype;
  updated_card public.gift_cards%rowtype;
  inserted_transaction public.member_transactions%rowtype;
  existing_receipt_transaction public.member_transactions%rowtype;
  catalog_title text;
  catalog_value_label text;
  receipt_number_value text;
  original_bill_value numeric(12,2);
  gift_card_amount_value numeric(12,2);
  bill_after_gift_card_value numeric(12,2);
  tax_charge_value numeric(12,2);
  service_charge_value numeric(12,2);
  total_before_gift_card_value numeric(12,2);
  final_bill_value numeric(12,2);
  purchase_amount_value numeric(12,2);
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
  available_balance_value numeric(12,2);
  remaining_balance_after_value numeric(12,2);
begin
  if actor_id is null then raise exception 'Authentication required'; end if;

  select * into actor_profile from public.profiles where id = actor_id;
  if not found then raise exception 'Redeeming profile not found'; end if;

  if actor_profile.role <> 'platform-admin' and (
    actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null
    or actor_profile.business_id <> p_business_id
  ) then
    raise exception 'Permission denied';
  end if;

  select * into business_row
  from public.businesses
  where id = p_business_id;

  if not found then raise exception 'Business not found'; end if;

  select * into card_row
  from public.gift_cards
  where id = p_gift_card_id
  for update;

  if not found then raise exception 'Gift card not found'; end if;
  if card_row.business_id <> p_business_id then raise exception 'Gift card belongs to a different business'; end if;
  if card_row.status = 'redeemed' then raise exception 'Gift card has no remaining balance'; end if;
  if card_row.status <> 'active' then raise exception 'Gift card is not active'; end if;

  select title, value_label into catalog_title, catalog_value_label
  from public.gift_card_catalog
  where id = card_row.catalog_id;

  available_balance_value := round(coalesce(card_row.remaining_balance, card_row.initial_balance, public.gift_card_face_value_from_label(catalog_value_label), 0)::numeric, 2);

  if available_balance_value <= 0 then
    update public.gift_cards
    set status = 'redeemed',
        remaining_balance = 0,
        redeemed_at = coalesce(redeemed_at, now()),
        redeemed_by = coalesce(redeemed_by, actor_id),
        redeemed_at_business = coalesce(redeemed_at_business, p_business_id)
    where id = card_row.id;
    raise exception 'Gift card has no remaining balance';
  end if;

  if now() >= card_row.expires_at then
    update public.gift_cards set status = 'expired' where id = card_row.id;
    insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
    values (card_row.id, 'expired', actor_id, jsonb_build_object('reason', 'redeem_attempt_after_expiry'));
    raise exception 'Gift card has expired';
  end if;

  if p_original_bill is not null then
    if p_original_bill <= 0 then
      raise exception 'Original bill must be greater than 0.';
    end if;

    receipt_number_value := nullif(trim(coalesce(p_receipt_number, '')), '');
    if receipt_number_value is null or length(receipt_number_value) < 3 then
      raise exception 'Receipt or bill number is required.';
    end if;

    select *
      into existing_receipt_transaction
    from public.member_transactions
    where business_id = business_row.id
      and lower(trim(receipt_number)) = lower(receipt_number_value)
    limit 1;

    if found then
      raise exception 'This receipt or bill number has already been recorded.';
    end if;

    original_bill_value := round(p_original_bill::numeric, 2);
    tax_charge_value := case
      when coalesce(business_row.tax_included_in_bill, false)
        then round((original_bill_value * coalesce(business_row.tax_rate, 0))::numeric, 2)
      else 0
    end;
    service_charge_value := case
      when coalesce(business_row.service_charge_enabled, false)
        then round((original_bill_value * coalesce(business_row.service_charge_rate, 0))::numeric, 2)
      else 0
    end;
    total_before_gift_card_value := round((original_bill_value + tax_charge_value + service_charge_value)::numeric, 2);
    gift_card_amount_value := round(least(greatest(coalesce(p_gift_card_amount, total_before_gift_card_value), 0), total_before_gift_card_value, available_balance_value)::numeric, 2);
    bill_after_gift_card_value := round(greatest(original_bill_value - gift_card_amount_value, 0)::numeric, 2);
    final_bill_value := round(greatest(total_before_gift_card_value - gift_card_amount_value, 0)::numeric, 2);
  else
    original_bill_value := null;
    gift_card_amount_value := round(least(greatest(coalesce(p_gift_card_amount, available_balance_value), 0), available_balance_value)::numeric, 2);
    bill_after_gift_card_value := null;
    tax_charge_value := 0;
    service_charge_value := 0;
    total_before_gift_card_value := null;
    final_bill_value := null;
  end if;

  if gift_card_amount_value <= 0 then
    raise exception 'Gift card amount must be greater than 0.';
  end if;

  remaining_balance_after_value := round(greatest(available_balance_value - gift_card_amount_value, 0)::numeric, 2);

  update public.gift_cards
  set status = case
        when remaining_balance_after_value <= 0 then 'redeemed'::public.gift_card_status
        else 'active'::public.gift_card_status
      end,
      initial_balance = coalesce(initial_balance, public.gift_card_face_value_from_label(catalog_value_label), available_balance_value),
      remaining_balance = remaining_balance_after_value,
      redeemed_at = case when remaining_balance_after_value <= 0 then now() else null end,
      redeemed_by = case when remaining_balance_after_value <= 0 then actor_id else null end,
      redeemed_at_business = case when remaining_balance_after_value <= 0 then p_business_id else null end,
      updated_at = now()
  where id = p_gift_card_id
    and status = 'active'
  returning * into updated_card;

  if not found then raise exception 'Gift card could not be updated'; end if;

  insert into public.gift_card_events (gift_card_id, event_type, actor_id, metadata)
  values (
    updated_card.id,
    'redeemed',
    actor_id,
    jsonb_build_object(
      'business_id', p_business_id,
      'original_bill', original_bill_value,
      'gift_card_amount', gift_card_amount_value,
      'bill_after_gift_card', bill_after_gift_card_value,
      'tax_added', tax_charge_value,
      'service_charge_added', service_charge_value,
      'total_before_gift_card', total_before_gift_card_value,
      'final_bill', final_bill_value,
      'remaining_balance_before', available_balance_value,
      'remaining_balance_after', remaining_balance_after_value,
      'receipt_number', receipt_number_value
    )
  );

  if original_bill_value is not null and original_bill_value > 0 then
    purchase_amount_value := original_bill_value;

    reward_value_value := round((purchase_amount_value * business_row.reward_rate_percent / 100)::numeric, 2);
    points_awarded_value := floor(reward_value_value);
    commission_amount_value := round((purchase_amount_value * business_row.commission_rate_percent / 100)::numeric, 2);

    insert into public.member_transactions (
      profile_id,
      business_id,
      purchase_amount,
      receipt_number,
      reward_rate_percent,
      reward_value,
      points_awarded,
      commission_rate_percent,
      commission_amount,
      recorded_by,
      note,
      client_request_id
    )
    values (
      updated_card.customer_id,
      business_row.id,
      purchase_amount_value,
      receipt_number_value,
      business_row.reward_rate_percent,
      reward_value_value,
      points_awarded_value,
      business_row.commission_rate_percent,
      commission_amount_value,
      actor_id,
      format(
        'Gift card code: %s. Gift card value: %s. Gift card remaining balance: %s. Original receipt total: %s. Bill after gift card: %s. Tax added: %s. Service charge added: %s. Total before gift card: %s. Final bill after gift card: %s.',
        updated_card.code,
        to_char(gift_card_amount_value, 'FM999999990.00'),
        to_char(remaining_balance_after_value, 'FM999999990.00'),
        to_char(original_bill_value, 'FM999999990.00'),
        to_char(bill_after_gift_card_value, 'FM999999990.00'),
        to_char(tax_charge_value, 'FM999999990.00'),
        to_char(service_charge_value, 'FM999999990.00'),
        to_char(total_before_gift_card_value, 'FM999999990.00'),
        to_char(final_bill_value, 'FM999999990.00')
      ),
      p_client_request_id
    )
    returning * into inserted_transaction;

    insert into public.reward_balances (profile_id)
    values (updated_card.customer_id)
    on conflict (profile_id) do nothing;

    update public.reward_balances
    set points = points + points_awarded_value
    where profile_id = updated_card.customer_id;

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
      updated_card.customer_id,
      business_row.id,
      'earned',
      format('Purchase at %s - %s %s', business_row.name, business_row.currency, to_char(purchase_amount_value, 'FM999999990.00')),
      format('%s %s reward value issued from receipt %s after gift card %s.', business_row.currency, to_char(reward_value_value, 'FM999999990.00'), receipt_number_value, updated_card.code),
      points_awarded_value,
      'posted'
    );
  end if;

  insert into public.activities (profile_id, business_id, type, title, description, points, status)
  values (
    updated_card.customer_id,
    updated_card.business_id,
    'gift_card_redeemed',
    case when remaining_balance_after_value <= 0 then 'Gift card redeemed' else 'Gift card used' end,
    format('%s. Remaining balance: %s', coalesce(catalog_title, updated_card.code), to_char(remaining_balance_after_value, 'FM999999990.00')),
    0,
    'posted'
  );

  return updated_card;
end;
$$;

revoke all on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid) from public;
grant execute on function public.redeem_gift_card(uuid, uuid, numeric, text, numeric, uuid) to authenticated;

notify pgrst, 'reload schema';
