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

-- Some hosted projects still expose the original *_value_amount names while
-- newer migrations and the application use initial_balance/remaining_balance.
-- Keep both pairs during the transition so old redemption RPCs and the current
-- client cannot disagree about the same card.
alter table public.gift_cards
  add column if not exists original_value_amount numeric(12,2),
  add column if not exists remaining_value_amount numeric(12,2),
  add column if not exists initial_balance numeric(12,2),
  add column if not exists remaining_balance numeric(12,2);

-- Hosted tenant/security triggers require an authenticated request context.
-- The migration runs as the database migration role, so suspend user triggers
-- only for this deterministic repair and restore them immediately afterward.
alter table public.gift_cards disable trigger user;

with face_values as (
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
),
resolved as (
  select
    gc.id,
    coalesce(gc.initial_balance, gc.original_value_amount, fv.face_value, 0) as original_amount,
    case
      when gc.status = 'redeemed' then 0
      else greatest(
        coalesce(
          gc.remaining_balance,
          gc.remaining_value_amount,
          coalesce(gc.initial_balance, gc.original_value_amount, fv.face_value, 0)
            - coalesce(r.redeemed_amount, 0)
        ),
        0
      )
    end as remaining_amount
  from public.gift_cards gc
  join face_values fv on fv.id = gc.id
  left join redemptions r on r.gift_card_id = gc.id
)
update public.gift_cards gc
set original_value_amount = resolved.original_amount,
    remaining_value_amount = resolved.remaining_amount,
    initial_balance = resolved.original_amount,
    remaining_balance = resolved.remaining_amount
from resolved
where gc.id = resolved.id
  and (
    gc.original_value_amount is distinct from resolved.original_amount
    or gc.remaining_value_amount is distinct from resolved.remaining_amount
    or gc.initial_balance is distinct from resolved.original_amount
    or gc.remaining_balance is distinct from resolved.remaining_amount
  );

alter table public.gift_cards enable trigger user;

create or replace function public.sync_gift_card_balance_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  face_value numeric(12,2) := 0;
  original_amount numeric(12,2);
  remaining_amount numeric(12,2);
begin
  select round(public.gift_card_face_value_from_label(value_label)::numeric, 2)
  into face_value
  from public.gift_card_catalog
  where id = new.catalog_id;

  if tg_op = 'UPDATE'
    and new.original_value_amount is distinct from old.original_value_amount
    and new.initial_balance is not distinct from old.initial_balance then
    original_amount := new.original_value_amount;
  elsif tg_op = 'UPDATE'
    and new.initial_balance is distinct from old.initial_balance
    and new.original_value_amount is not distinct from old.original_value_amount then
    original_amount := new.initial_balance;
  else
    original_amount := coalesce(new.initial_balance, new.original_value_amount, face_value, 0);
  end if;

  if new.status = 'redeemed' then
    remaining_amount := 0;
  elsif tg_op = 'UPDATE'
    and new.remaining_value_amount is distinct from old.remaining_value_amount
    and new.remaining_balance is not distinct from old.remaining_balance then
    remaining_amount := new.remaining_value_amount;
  elsif tg_op = 'UPDATE'
    and new.remaining_balance is distinct from old.remaining_balance
    and new.remaining_value_amount is not distinct from old.remaining_value_amount then
    remaining_amount := new.remaining_balance;
  else
    remaining_amount := coalesce(
      new.remaining_balance,
      new.remaining_value_amount,
      original_amount,
      face_value,
      0
    );
  end if;

  new.original_value_amount := greatest(coalesce(original_amount, 0), 0);
  new.initial_balance := new.original_value_amount;
  new.remaining_value_amount := greatest(coalesce(remaining_amount, 0), 0);
  new.remaining_balance := new.remaining_value_amount;
  return new;
end;
$$;

drop trigger if exists sync_gift_card_balance_columns on public.gift_cards;
create trigger sync_gift_card_balance_columns
  before insert or update on public.gift_cards
  for each row execute function public.sync_gift_card_balance_columns();

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

  face_value := round(public.gift_card_face_value_from_label(catalog_row.value_label)::numeric, 2);
  if face_value <= 0 then
    raise exception 'Gift card value must be greater than 0';
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
        original_value_amount,
        remaining_value_amount,
        initial_balance,
        remaining_balance,
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
      'remaining_points', remaining_points,
      'initial_balance', face_value,
      'remaining_balance', face_value
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

drop function if exists public.get_public_gift_card_by_token(text);
create function public.get_public_gift_card_by_token(p_token text)
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

revoke all on function public.get_public_gift_card_by_token(text) from public;
grant execute on function public.get_public_gift_card_by_token(text) to anon, authenticated;

drop function if exists public.get_business_gift_cards(uuid);
create function public.get_business_gift_cards(p_business_id uuid)
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
      when gc.expires_at is not null and gc.expires_at <= now() then 'expired'::public.gift_card_status
      when coalesce(
        gc.remaining_balance,
        gc.remaining_value_amount,
        public.gift_card_face_value_from_label(gcc.value_label),
        0
      ) <= 0 then 'redeemed'::public.gift_card_status
      else gc.status
    end as status,
    gc.points_spent,
    coalesce(
      gc.initial_balance,
      gc.original_value_amount,
      public.gift_card_face_value_from_label(gcc.value_label),
      0
    ) as initial_balance,
    coalesce(
      gc.remaining_balance,
      gc.remaining_value_amount,
      public.gift_card_face_value_from_label(gcc.value_label),
      0
    ) as remaining_balance,
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

notify pgrst, 'reload schema';
