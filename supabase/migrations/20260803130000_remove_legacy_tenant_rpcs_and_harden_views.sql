-- Remove superseded single-tenant RPC overloads. The application and permanent
-- test helpers use the program-scoped replacements introduced in later
-- migrations.
drop function if exists public.mock_subscribe();
drop function if exists public.mock_renew();
drop function if exists public.mock_cancel();
drop function if exists public.grant_membership_credit(uuid, integer);
drop function if exists public.consume_reward_credit(uuid);
drop function if exists public.record_member_transaction(text, numeric, text, uuid);

-- Evaluate the legacy compatibility views with the querying user's privileges
-- and RLS policies instead of the view owner's privileges.
alter view if exists public.active_rewards set (security_invoker = true);
alter view if exists public.active_promotions set (security_invoker = true);
alter view if exists public.app_customers set (security_invoker = true);

-- Keep checkout program-scoped while using a JSON value for normalized cart
-- rows. This avoids session-local temporary tables and makes the function safe
-- for static database linting as well as pooled connections.
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
  normalized_items jsonb;
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

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'product_id', grouped.product_id,
        'quantity', grouped.quantity
      )
      order by grouped.product_id
    ),
    '[]'::jsonb
  )
  into normalized_items
  from (
    select raw.product_id, sum(raw.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as raw(product_id uuid, quantity integer)
    where raw.product_id is not null
    group by raw.product_id
  ) grouped;

  item_count := jsonb_array_length(normalized_items);
  if item_count = 0 then raise exception 'Your cart is empty.'; end if;
  if exists (
    select 1
    from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
    where ci.quantity is null or ci.quantity <= 0
  ) then
    raise exception 'Cart quantities must be greater than zero.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
    left join public.products p on p.id = ci.product_id
    where p.id is null
  ) then
    raise exception 'One or more cart items are no longer available.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
    join public.products p on p.id = ci.product_id
    where p.business_id <> business_row.id
       or p.program_id <> business_row.program_id
  ) then
    raise exception 'Checkout supports one business and rewards program per order.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
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
  from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
  join public.products p
    on p.id = ci.product_id
   and p.business_id = business_row.id
   and p.program_id = business_row.program_id;

  total_value := round(subtotal_value + tax_value, 2);
  points_earned_value := floor(total_value * business_row.earn_rate);

  update public.products p
  set inventory = p.inventory - ci.quantity
  from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
  where p.id = ci.product_id
    and p.business_id = business_row.id
    and p.program_id = business_row.program_id
    and p.inventory >= ci.quantity;

  get diagnostics item_count = row_count;
  if item_count <> jsonb_array_length(normalized_items) then
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
  from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
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
      (
        select sum(ci.quantity)
        from jsonb_to_recordset(normalized_items) as ci(product_id uuid, quantity integer)
      ),
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

notify pgrst, 'reload schema';
