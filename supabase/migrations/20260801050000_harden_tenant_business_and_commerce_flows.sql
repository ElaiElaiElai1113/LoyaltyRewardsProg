-- Final tenant-scope hardening for business access and customer commerce.
-- Every privileged business action is bound to an active membership for the
-- exact program, business, and role. Commerce writes always carry program_id.

create or replace function public.has_active_business_program_access(
  p_business_id uuid,
  p_roles public.program_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin() or (
    public.has_staff_access()
    and exists (
      select 1
      from public.businesses b
      join public.program_memberships pm
        on pm.program_id = b.program_id
       and pm.business_id = b.id
       and pm.profile_id = auth.uid()
       and pm.status = 'active'
       and pm.role = any(p_roles)
      join public.profiles p
        on p.id = pm.profile_id
       and p.business_id = b.id
       and p.role::text = pm.role::text
      where b.id = p_business_id
        and b.active = true
    )
  );
$$;

revoke all on function public.has_active_business_program_access(uuid, public.program_role[]) from public;
grant execute on function public.has_active_business_program_access(uuid, public.program_role[]) to authenticated;

drop policy if exists "business teams read their customer links" on public.business_customer_links;
create policy "business teams read their customer links"
  on public.business_customer_links for select to authenticated
  using (
    public.has_active_business_program_access(
      business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
  );

drop policy if exists "business teams create their customer links" on public.business_customer_links;
create policy "business teams create their customer links"
  on public.business_customer_links for insert to authenticated
  with check (
    linked_by = auth.uid()
    and public.has_active_business_program_access(
      business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
    and exists (
      select 1
      from public.program_memberships customer_pm
      where customer_pm.program_id = business_customer_links.program_id
        and customer_pm.profile_id = business_customer_links.profile_id
        and customer_pm.role = 'member'
        and customer_pm.status = 'active'
    )
  );

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

  select b.program_id into v_program_id
  from public.businesses b
  where b.id = p_business_id;

  if v_program_id is null then
    raise exception 'business_not_found';
  end if;

  if not public.is_platform_admin()
    and not public.has_active_business_program_access(
      p_business_id,
      array['business-owner', 'business-staff']::public.program_role[]
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

drop policy if exists "Business owners can view profiles for their business" on public.profiles;
create policy "Business owners can view profiles for their business"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.business_customer_links link
      where link.profile_id = profiles.id
        and public.has_active_business_program_access(
          link.business_id,
          array['business-owner', 'business-staff']::public.program_role[]
        )
    )
    or exists (
      select 1
      from public.orders o
      where o.profile_id = profiles.id
        and public.has_active_business_program_access(
          o.business_id,
          array['business-owner', 'business-staff']::public.program_role[]
        )
    )
    or (
      registered_by_business_id is not null
      and public.has_active_business_program_access(
        registered_by_business_id,
        array['business-owner', 'business-staff']::public.program_role[]
      )
    )
  );

drop policy if exists "Business owners can view customer balances" on public.reward_balances;
create policy "Business owners can view customer balances"
  on public.reward_balances for select to authenticated
  using (
    exists (
      select 1
      from public.business_customer_links link
      where link.profile_id = reward_balances.profile_id
        and link.program_id = reward_balances.program_id
        and public.has_active_business_program_access(
          link.business_id,
          array['business-owner', 'business-staff']::public.program_role[]
        )
    )
  );

create or replace function public.create_owner_product(
  p_title text,
  p_description text,
  p_category text,
  p_price numeric,
  p_highlight text,
  p_inventory integer
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  inserted_product public.products%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into actor_profile from public.profiles where id = auth.uid();
  if not found
    or actor_profile.role <> 'business-owner'
    or actor_profile.business_id is null
    or not public.has_active_business_program_access(
      actor_profile.business_id,
      array['business-owner']::public.program_role[]
    )
  then
    raise exception 'Only an active business owner can create products.';
  end if;

  select * into business_row
  from public.businesses
  where id = actor_profile.business_id
    and active = true;
  if not found then raise exception 'Business not found.'; end if;

  insert into public.products (
    program_id, business_id, title, description, category, price,
    highlight, inventory, featured
  )
  values (
    business_row.program_id,
    business_row.id,
    trim(p_title),
    trim(coalesce(p_description, '')),
    p_category::public.product_category,
    p_price,
    trim(coalesce(p_highlight, '')),
    coalesce(p_inventory, 0),
    false
  )
  returning * into inserted_product;

  return inserted_product;
end;
$$;

revoke all on function public.create_owner_product(text, text, text, numeric, text, integer) from public;
grant execute on function public.create_owner_product(text, text, text, numeric, text, integer) to authenticated;

create or replace function public.create_owner_promotion(
  p_title text,
  p_description text,
  p_badge text,
  p_cta text,
  p_audience text
)
returns public.promotions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  inserted_promotion public.promotions%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into actor_profile from public.profiles where id = auth.uid();
  if not found
    or actor_profile.role <> 'business-owner'
    or actor_profile.business_id is null
    or not public.has_active_business_program_access(
      actor_profile.business_id,
      array['business-owner']::public.program_role[]
    )
  then
    raise exception 'Only an active business owner can create promotions.';
  end if;

  select * into business_row
  from public.businesses
  where id = actor_profile.business_id
    and active = true;
  if not found then raise exception 'Business not found.'; end if;

  insert into public.promotions (
    program_id, business_id, title, description, badge, cta, audience,
    expires_at, active
  )
  values (
    business_row.program_id,
    business_row.id,
    trim(p_title),
    trim(coalesce(p_description, '')),
    trim(coalesce(p_badge, '')),
    trim(coalesce(p_cta, '')),
    trim(coalesce(p_audience, '')),
    now() + interval '14 days',
    true
  )
  returning * into inserted_promotion;

  return inserted_promotion;
end;
$$;

revoke all on function public.create_owner_promotion(text, text, text, text, text) from public;
grant execute on function public.create_owner_promotion(text, text, text, text, text) to authenticated;

create or replace function public.create_owner_gift_card_catalog_item(
  p_title text,
  p_description text,
  p_image_url text,
  p_points_cost integer,
  p_value_label text,
  p_expiry_days integer,
  p_is_active boolean
)
returns public.gift_card_catalog
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  inserted_item public.gift_card_catalog%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into actor_profile from public.profiles where id = auth.uid();
  if not found
    or actor_profile.role <> 'business-owner'
    or actor_profile.business_id is null
    or not public.has_active_business_program_access(
      actor_profile.business_id,
      array['business-owner']::public.program_role[]
    )
  then
    raise exception 'Only an active business owner can create gift cards.';
  end if;

  select * into business_row
  from public.businesses
  where id = actor_profile.business_id
    and active = true;
  if not found then raise exception 'Business not found.'; end if;

  insert into public.gift_card_catalog (
    program_id, business_id, title, description, image_url, points_cost,
    value_label, expiry_days, is_active, created_by
  )
  values (
    business_row.program_id,
    business_row.id,
    trim(p_title),
    trim(coalesce(p_description, '')),
    nullif(trim(coalesce(p_image_url, '')), ''),
    p_points_cost,
    trim(coalesce(p_value_label, '')),
    p_expiry_days,
    coalesce(p_is_active, true),
    actor_profile.id
  )
  returning * into inserted_item;

  return inserted_item;
end;
$$;

revoke all on function public.create_owner_gift_card_catalog_item(text, text, text, integer, text, integer, boolean) from public;
grant execute on function public.create_owner_gift_card_catalog_item(text, text, text, integer, text, integer, boolean) to authenticated;

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
  face_value numeric(12,2);
begin
  if actor_id is null then raise exception 'Authentication required'; end if;

  select * into actor_profile from public.profiles where id = actor_id;
  if not found then raise exception 'Issuing profile not found'; end if;

  select * into customer_profile from public.profiles where id = p_customer_id;
  if not found then raise exception 'Customer not found'; end if;
  if customer_profile.role <> 'customer' then
    raise exception 'Gift cards can only be issued to customers';
  end if;

  select * into catalog_row
  from public.gift_card_catalog
  where id = p_catalog_id
    and is_active = true;
  if not found then raise exception 'Gift card catalog item is not active'; end if;

  if not exists (
    select 1
    from public.businesses b
    where b.id = catalog_row.business_id
      and b.program_id = catalog_row.program_id
      and b.active = true
  ) then
    raise exception 'Gift card business is not active in this rewards program';
  end if;

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

  if actor_profile.role = 'business-owner' and not public.has_active_business_program_access(
    catalog_row.business_id,
    array['business-owner']::public.program_role[]
  ) then
    raise exception 'Permission denied';
  end if;

  if actor_profile.role not in ('customer', 'platform-admin', 'business-owner') then
    raise exception 'Permission denied';
  end if;

  face_value := round(public.gift_card_face_value_from_label(catalog_row.value_label)::numeric, 2);
  if face_value <= 0 then raise exception 'Gift card value must be greater than 0'; end if;

  insert into public.reward_balances (program_id, profile_id)
  values (catalog_row.program_id, p_customer_id)
  on conflict (program_id, profile_id) do nothing;

  select * into balance_row
  from public.reward_balances
  where program_id = catalog_row.program_id
    and profile_id = p_customer_id
  for update;

  if balance_row.points < catalog_row.points_cost then raise exception 'Insufficient points'; end if;

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
        program_id, catalog_id, business_id, customer_id, issued_by, code,
        public_token, status, points_spent, original_value_amount,
        remaining_value_amount, initial_balance, remaining_balance, expires_at
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
        face_value,
        face_value,
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

  insert into public.gift_card_events (
    program_id, gift_card_id, event_type, actor_id, metadata
  )
  values (
    catalog_row.program_id,
    next_card.id,
    'issued',
    actor_id,
    jsonb_build_object(
      'catalog_id', catalog_row.id,
      'business_id', catalog_row.business_id,
      'points_spent', catalog_row.points_cost,
      'remaining_points', remaining_points,
      'initial_balance', face_value,
      'remaining_balance', face_value
    )
  );

  insert into public.activities (
    program_id, profile_id, business_id, type, title, description, points, status
  )
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
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  if not public.is_platform_admin()
    and not public.has_active_business_program_access(
      p_business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
  then
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
      when gc.expires_at is not null and gc.expires_at <= now() then 'expired'::public.gift_card_status
      when coalesce(
        gc.remaining_balance,
        gc.remaining_value_amount,
        public.gift_card_face_value_from_label(gcc.value_label),
        0
      ) <= 0 then 'redeemed'::public.gift_card_status
      else gc.status
    end,
    gc.points_spent,
    coalesce(
      gc.initial_balance,
      gc.original_value_amount,
      public.gift_card_face_value_from_label(gcc.value_label),
      0
    ),
    coalesce(
      gc.remaining_balance,
      gc.remaining_value_amount,
      public.gift_card_face_value_from_label(gcc.value_label),
      0
    ),
    gc.expires_at,
    gc.redeemed_at,
    gc.redeemed_by,
    gc.redeemed_at_business,
    gc.created_at,
    gc.updated_at,
    coalesce(gcc.title, 'Gift card'),
    coalesce(gcc.description, ''),
    coalesce(gcc.value_label, ''),
    gcc.image_url,
    b.name,
    b.logo_url,
    split_part(coalesce(customer.full_name, 'Member'), ' ', 1),
    nullif(latest_redemption.metadata ->> 'original_bill', '')::numeric,
    nullif(latest_redemption.metadata ->> 'gift_card_amount', '')::numeric,
    nullif(latest_redemption.metadata ->> 'receipt_number', '')
  from public.gift_cards gc
  join public.businesses b
    on b.id = gc.business_id
   and b.program_id = gc.program_id
  join public.profiles customer on customer.id = gc.customer_id
  left join public.gift_card_catalog gcc
    on gcc.id = gc.catalog_id
   and gcc.program_id = gc.program_id
  left join lateral (
    select gce.metadata
    from public.gift_card_events gce
    where gce.gift_card_id = gc.id
      and gce.program_id = gc.program_id
      and gce.event_type = 'redeemed'
    order by gce.created_at desc
    limit 1
  ) latest_redemption on true
  where gc.business_id = p_business_id
    and gc.program_id = b.program_id
  order by gc.created_at desc;
end;
$$;

revoke all on function public.get_business_gift_cards(uuid) from public;
grant execute on function public.get_business_gift_cards(uuid) to authenticated;

create or replace function public.credit_partner_referral(
  p_customer_profile_id uuid,
  p_business_id uuid,
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
  referral_row public.partner_referrals%rowtype;
  referrer_row public.partner_referrers%rowtype;
begin
  if p_customer_profile_id is null or p_business_id is null or p_order_id is null then
    return;
  end if;

  select b.program_id into v_program_id
  from public.businesses b
  join public.orders o
    on o.id = p_order_id
   and o.business_id = b.id
   and o.program_id = b.program_id
   and o.profile_id = p_customer_profile_id
  where b.id = p_business_id;

  if v_program_id is null then return; end if;

  select * into referral_row
  from public.partner_referrals
  where program_id = v_program_id
    and customer_profile_id = p_customer_profile_id
    and source_business_id = p_business_id
    and status = 'attributed'
    and first_order_id is null
  order by created_at asc
  limit 1
  for update;

  if not found then return; end if;

  select * into referrer_row
  from public.partner_referrers
  where id = referral_row.partner_referrer_id
    and program_id = v_program_id
    and business_id = p_business_id
    and active = true
  limit 1;

  if not found then return; end if;

  update public.partner_referrals
  set first_order_id = p_order_id,
      status = 'credited',
      credited_at = now()
  where id = referral_row.id
    and program_id = v_program_id
    and first_order_id is null;

  if not found then return; end if;

  insert into public.partner_credit_ledger (
    program_id, partner_referrer_id, partner_referral_id, order_id,
    credit_type, credit_units, details
  )
  values (
    v_program_id,
    referral_row.partner_referrer_id,
    referral_row.id,
    p_order_id,
    'partner-credit',
    1,
    format(
      '1 partner credit awarded to %s for the first paid order from customer %s.',
      referrer_row.contact_name,
      p_customer_profile_id
    )
  )
  on conflict (partner_referral_id) do nothing;
end;
$$;

revoke all on function public.credit_partner_referral(uuid, uuid, uuid) from public, anon, authenticated;

create or replace function public.place_order(
  p_business_id uuid,
  p_payment_method text,
  p_items jsonb,
  p_client_request_id uuid default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  actor_name text;
  business_row public.businesses%rowtype;
  existing_order public.orders%rowtype;
  inserted_order public.orders%rowtype;
  item_count integer;
  subtotal_value numeric(12,2);
  tax_value numeric(12,2);
  total_value numeric(12,2);
  points_earned_value integer;
begin
  if actor_id is null then raise exception 'Authentication required'; end if;
  if p_business_id is null then raise exception 'Business is required.'; end if;
  if coalesce(jsonb_typeof(p_items), '') <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.';
  end if;
  if p_payment_method not in ('visa', 'mastercard', 'applepay') then
    raise exception 'Unsupported payment method.';
  end if;

  select * into actor_profile
  from public.profiles
  where id = actor_id
    and role = 'customer';
  if not found then raise exception 'Only customer accounts can place orders.'; end if;

  select * into business_row
  from public.businesses
  where id = p_business_id
    and active = true
  for share;
  if not found then raise exception 'Business not found.'; end if;

  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = business_row.program_id
      and pm.profile_id = actor_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'Customer is not an active member of this rewards program';
  end if;

  if p_client_request_id is not null then
    select * into existing_order
    from public.orders
    where program_id = business_row.program_id
      and business_id = business_row.id
      and profile_id = actor_id
      and client_request_id = p_client_request_id
    limit 1;
    if found then return existing_order; end if;
  end if;

  create temporary table if not exists pg_temp.checkout_items (
    product_id uuid primary key,
    quantity integer not null
  ) on commit drop;
  truncate table pg_temp.checkout_items;

  insert into pg_temp.checkout_items (product_id, quantity)
  select raw.product_id, sum(raw.quantity)::integer
  from jsonb_to_recordset(p_items) as raw(product_id uuid, quantity integer)
  where raw.product_id is not null
  group by raw.product_id;

  get diagnostics item_count = row_count;
  if item_count = 0 then raise exception 'Your cart is empty.'; end if;
  if exists (select 1 from pg_temp.checkout_items where quantity <= 0) then
    raise exception 'Cart quantities must be greater than zero.';
  end if;

  if exists (
    select 1
    from pg_temp.checkout_items ci
    left join public.products p on p.id = ci.product_id
    where p.id is null
  ) then
    raise exception 'One or more cart items are no longer available.';
  end if;

  if exists (
    select 1
    from pg_temp.checkout_items ci
    join public.products p on p.id = ci.product_id
    where p.business_id <> business_row.id
       or p.program_id <> business_row.program_id
  ) then
    raise exception 'Checkout supports one business and rewards program per order.';
  end if;

  if exists (
    select 1
    from pg_temp.checkout_items ci
    join public.products p
      on p.id = ci.product_id
     and p.business_id = business_row.id
     and p.program_id = business_row.program_id
    where p.inventory < ci.quantity
  ) then
    raise exception 'One or more items do not have enough inventory.';
  end if;

  select
    round(coalesce(sum(p.price * ci.quantity), 0)::numeric, 2),
    round(coalesce(sum(p.price * ci.quantity), 0)::numeric * business_row.tax_rate, 2)
  into subtotal_value, tax_value
  from pg_temp.checkout_items ci
  join public.products p
    on p.id = ci.product_id
   and p.business_id = business_row.id
   and p.program_id = business_row.program_id;

  total_value := round(subtotal_value + tax_value, 2);
  points_earned_value := floor(total_value * business_row.earn_rate);

  update public.products p
  set inventory = p.inventory - ci.quantity
  from pg_temp.checkout_items ci
  where p.id = ci.product_id
    and p.business_id = business_row.id
    and p.program_id = business_row.program_id
    and p.inventory >= ci.quantity;

  get diagnostics item_count = row_count;
  if item_count <> (select count(*) from pg_temp.checkout_items) then
    raise exception 'Inventory changed before checkout completed. Please refresh your cart and try again.';
  end if;

  insert into public.orders (
    program_id, profile_id, business_id, subtotal, tax, total, points_earned,
    points_status, payment_method, status, client_request_id
  )
  values (
    business_row.program_id,
    actor_id,
    business_row.id,
    subtotal_value,
    tax_value,
    total_value,
    points_earned_value,
    'posted',
    p_payment_method,
    'confirmed',
    p_client_request_id
  )
  returning * into inserted_order;

  insert into public.order_line_items (
    program_id, order_id, product_id, product_title, unit_price, quantity, subtotal
  )
  select
    business_row.program_id,
    inserted_order.id,
    p.id,
    p.title,
    p.price,
    ci.quantity,
    round((p.price * ci.quantity)::numeric, 2)
  from pg_temp.checkout_items ci
  join public.products p
    on p.id = ci.product_id
   and p.business_id = business_row.id
   and p.program_id = business_row.program_id;

  insert into public.reward_balances (program_id, profile_id)
  values (business_row.program_id, actor_id)
  on conflict (program_id, profile_id) do nothing;

  update public.reward_balances
  set points = points + points_earned_value,
      updated_at = now()
  where program_id = business_row.program_id
    and profile_id = actor_id;

  perform public.credit_partner_referral(actor_id, business_row.id, inserted_order.id);

  actor_name := actor_profile.full_name;

  insert into public.activities (
    program_id, profile_id, business_id, type, title, description, points, status
  )
  values (
    business_row.program_id,
    actor_id,
    business_row.id,
    'earned',
    format(
      'Purchase at %s - %s %s',
      business_row.name,
      business_row.currency,
      to_char(total_value, 'FM999999990.00')
    ),
    format(
      '%s item(s) ordered. %s points posted after checkout.',
      (select sum(quantity) from pg_temp.checkout_items),
      points_earned_value
    ),
    points_earned_value,
    'posted'
  );

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  values (
    business_row.program_id,
    actor_id,
    coalesce(actor_name, 'Customer checkout'),
    'Order placed',
    format(
      'Order %s placed for business %s. Total: %s %s. Points posted: %s.',
      inserted_order.id,
      business_row.name,
      business_row.currency,
      to_char(total_value, 'FM999999990.00'),
      points_earned_value
    )
  );

  return inserted_order;
exception
  when unique_violation then
    if p_client_request_id is not null and business_row.program_id is not null then
      select * into existing_order
      from public.orders
      where program_id = business_row.program_id
        and business_id = business_row.id
        and profile_id = actor_id
        and client_request_id = p_client_request_id
      limit 1;
      if found then return existing_order; end if;
    end if;
    raise;
end;
$$;

revoke all on function public.place_order(uuid, text, jsonb, uuid) from public;
grant execute on function public.place_order(uuid, text, jsonb, uuid) to authenticated;

create or replace function public.redeem_reward(
  p_reward_id uuid,
  p_pickup_window text,
  p_notes text default null,
  p_client_request_id uuid default null
)
returns public.redemptions
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  reward_row public.rewards%rowtype;
  balance_row public.reward_balances%rowtype;
  existing_redemption public.redemptions%rowtype;
  inserted_redemption public.redemptions%rowtype;
begin
  if actor_id is null then raise exception 'Authentication required'; end if;
  if p_reward_id is null then raise exception 'Reward not found.'; end if;
  if p_pickup_window not in ('Now', 'Within 30 mins', 'Later today') then
    raise exception 'Invalid pickup window.';
  end if;

  select * into actor_profile
  from public.profiles
  where id = actor_id
    and role = 'customer';
  if not found then raise exception 'Only customer accounts can redeem rewards.'; end if;

  select * into reward_row
  from public.rewards
  where id = p_reward_id
  for update;
  if not found then raise exception 'Reward not found.'; end if;

  select * into business_row
  from public.businesses
  where id = reward_row.business_id
    and program_id = reward_row.program_id
    and active = true;
  if not found then raise exception 'Reward business is not active in this rewards program.'; end if;

  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = reward_row.program_id
      and pm.profile_id = actor_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'Customer is not an active member of this rewards program';
  end if;

  if not exists (
    select 1
    from public.memberships m
    where m.program_id = reward_row.program_id
      and m.profile_id = actor_id
      and m.status = 'active'
      and m.current_period_end > now()
  ) then
    raise exception 'membership_required';
  end if;

  if p_client_request_id is not null then
    select * into existing_redemption
    from public.redemptions
    where program_id = reward_row.program_id
      and profile_id = actor_id
      and client_request_id = p_client_request_id
    limit 1;
    if found then return existing_redemption; end if;
  end if;

  if reward_row.inventory <= 0 then
    raise exception 'That reward is currently out of stock.';
  end if;

  insert into public.reward_balances (program_id, profile_id)
  values (reward_row.program_id, actor_id)
  on conflict (program_id, profile_id) do nothing;

  select * into balance_row
  from public.reward_balances
  where program_id = reward_row.program_id
    and profile_id = actor_id
  for update;

  if balance_row.points < reward_row.points_cost then
    raise exception 'You do not have enough XP for this reward yet.';
  end if;

  update public.rewards
  set inventory = inventory - 1
  where id = reward_row.id
    and program_id = reward_row.program_id
    and inventory > 0;
  if not found then raise exception 'That reward is currently out of stock.'; end if;

  update public.reward_balances
  set points = points - reward_row.points_cost,
      updated_at = now()
  where program_id = reward_row.program_id
    and profile_id = actor_id
    and points >= reward_row.points_cost;
  if not found then raise exception 'You do not have enough XP for this reward yet.'; end if;

  insert into public.redemptions (
    program_id, profile_id, reward_id, reward_title, points_cost,
    pickup_window, notes, status, client_request_id
  )
  values (
    reward_row.program_id,
    actor_id,
    reward_row.id,
    reward_row.title,
    reward_row.points_cost,
    p_pickup_window,
    nullif(trim(coalesce(p_notes, '')), ''),
    'ready',
    p_client_request_id
  )
  returning * into inserted_redemption;

  insert into public.activities (
    program_id, profile_id, business_id, type, title, description, points, status
  )
  values (
    reward_row.program_id,
    actor_id,
    reward_row.business_id,
    'redeemed',
    format('%s redeemed', reward_row.title),
    case
      when nullif(trim(coalesce(p_notes, '')), '') is null
        then format('%s pickup selected', p_pickup_window)
      else format(
        '%s pickup selected - %s',
        p_pickup_window,
        nullif(trim(coalesce(p_notes, '')), '')
      )
    end,
    -reward_row.points_cost,
    'posted'
  );

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  values (
    reward_row.program_id,
    actor_id,
    coalesce(actor_profile.full_name, 'Customer redemption'),
    'Reward redeemed',
    format(
      'Reward %s redeemed at business %s for %s XP.',
      reward_row.title,
      reward_row.business_id,
      reward_row.points_cost
    )
  );

  return inserted_redemption;
exception
  when unique_violation then
    if p_client_request_id is not null and reward_row.program_id is not null then
      select * into existing_redemption
      from public.redemptions
      where program_id = reward_row.program_id
        and profile_id = actor_id
        and client_request_id = p_client_request_id
      limit 1;
      if found then return existing_redemption; end if;
    end if;
    raise;
end;
$$;

revoke all on function public.redeem_reward(uuid, text, text, uuid) from public;
grant execute on function public.redeem_reward(uuid, text, text, uuid) to authenticated;

notify pgrst, 'reload schema';
