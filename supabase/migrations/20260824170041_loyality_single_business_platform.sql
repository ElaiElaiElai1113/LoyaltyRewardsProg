-- Loyality is the single-business, white-label product described in
-- Loyality-How-It-Works.docx. It shares the Loyalty Platforms database while
-- keeping every operational row isolated by program_id and business_id.

-- Management API migrations run without an end-user JWT. Mark this transaction
-- as the service role so the existing cross-tenant write guards permit only
-- these explicit, migration-owned seed records.
select set_config('request.jwt.claim.role', 'service_role', true);

insert into public.programs (
  id, name, slug, status, country_code, locale, currency, timezone,
  primary_color, accent_color, logo_url, support_email,
  map_latitude, map_longitude, feature_flags
) values (
  '10000000-0000-4000-8000-000000000007',
  'Loyality',
  'loyality',
  'active',
  'US',
  'en-US',
  'USD',
  'America/New_York',
  '#173b3f',
  '#ff6b4a',
  '/loyality-logo.svg',
  'support@loyality.app',
  40.7128,
  -74.0060,
  '{"loyalitySingleBusiness":true,"offerReferralLoops":true,"visitRewards":true,"voucherOnly":true,"raffles":true,"customerCommerce":false}'::jsonb
)
on conflict (slug) do update
set
  name = excluded.name,
  status = excluded.status,
  country_code = excluded.country_code,
  locale = excluded.locale,
  currency = excluded.currency,
  timezone = excluded.timezone,
  primary_color = excluded.primary_color,
  accent_color = excluded.accent_color,
  logo_url = excluded.logo_url,
  support_email = excluded.support_email,
  map_latitude = excluded.map_latitude,
  map_longitude = excluded.map_longitude,
  feature_flags = public.programs.feature_flags || excluded.feature_flags,
  updated_at = now();

insert into public.program_settings (
  program_id, reward_name, default_earn_rate, membership_price_cents,
  referral_bonus, email_from_name, email_from_address
)
select id, 'Visits', 1, 0, 1, 'Loyality', 'support@loyality.app'
from public.programs
where slug = 'loyality'
on conflict (program_id) do update
set
  reward_name = excluded.reward_name,
  default_earn_rate = excluded.default_earn_rate,
  membership_price_cents = excluded.membership_price_cents,
  referral_bonus = excluded.referral_bonus,
  email_from_name = excluded.email_from_name,
  email_from_address = excluded.email_from_address,
  updated_at = now();

insert into public.program_subscriptions (program_id, plan_id, status)
select p.id, sp.id, 'trialing'::public.program_subscription_status
from public.programs p
cross join public.subscription_plans sp
where p.slug = 'loyality' and sp.code = 'launch'
on conflict (program_id) do update
set
  plan_id = excluded.plan_id,
  status = 'trialing'::public.program_subscription_status,
  stripe_customer_id = null,
  stripe_subscription_id = null,
  updated_at = now();

insert into public.program_domains (
  program_id, hostname, is_primary, verification_status, verified_at
)
select id, 'loyality-rewards.vercel.app', true, 'verified', now()
from public.programs
where slug = 'loyality'
on conflict (hostname) do update
set
  program_id = excluded.program_id,
  is_primary = excluded.is_primary,
  verification_status = excluded.verification_status,
  verified_at = excluded.verified_at;

insert into public.businesses (
  id, program_id, name, slug, description, address, earn_rate,
  reward_rate_percent, commission_rate_percent, currency, active
)
select
  '70000000-0000-4000-8000-000000000001',
  id,
  'Loyality Demo Business',
  'loyality-demo-business',
  'A configurable single-business loyalty program powered by Loyality.',
  'Your business address',
  1,
  10,
  10,
  currency,
  true
from public.programs
where slug = 'loyality'
on conflict (id) do update
set
  program_id = excluded.program_id,
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  earn_rate = excluded.earn_rate,
  reward_rate_percent = excluded.reward_rate_percent,
  commission_rate_percent = excluded.commission_rate_percent,
  currency = excluded.currency,
  active = excluded.active,
  updated_at = now();

create table if not exists public.loyality_business_settings (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  public_business_name text not null,
  tagline text not null default 'Turn every visit into the next one.',
  membership_tiers jsonb not null default '[{"name":"Free","price":0,"benefits":["Member QR","Visit rewards","Referral offers"]}]'::jsonb,
  referral_reward_title text not null default 'Referral thank-you',
  referral_reward_kind text not null default 'item' check (referral_reward_kind in ('item', 'amount', 'discount')),
  referral_reward_value numeric(12,2),
  referral_reward_description text not null default 'A thank-you reward for bringing in a new customer.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id),
  unique (program_id, business_id)
);

create table if not exists public.loyality_offers (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  public_token text not null default encode(gen_random_bytes(18), 'hex'),
  title text not null,
  description text not null default '',
  source_label text not null default 'direct',
  reward_title text not null,
  reward_kind text not null default 'item' check (reward_kind in ('item', 'amount', 'discount')),
  reward_value numeric(12,2),
  reward_description text not null default '',
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (public_token),
  unique (program_id, id),
  unique (business_id, id),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.loyality_offer_claims (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  offer_id uuid not null references public.loyality_offers(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  referrer_id uuid references public.profiles(id) on delete set null,
  source_label text not null default 'direct',
  status text not null default 'claimed' check (status in ('claimed', 'redeemed', 'cancelled')),
  claimed_at timestamptz not null default now(),
  redeemed_at timestamptz,
  referral_reward_issued_at timestamptz,
  unique (offer_id, customer_id),
  unique (program_id, id),
  unique (business_id, id),
  check (referrer_id is null or referrer_id <> customer_id)
);

create table if not exists public.loyality_visit_rules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  trigger_visit_count integer not null check (trigger_visit_count > 0),
  repeat_every integer check (repeat_every is null or repeat_every > 0),
  reward_title text not null,
  reward_kind text not null default 'item' check (reward_kind in ('item', 'amount', 'discount')),
  reward_value numeric(12,2),
  reward_description text not null default '',
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, id),
  unique (business_id, id)
);

create table if not exists public.loyality_visits (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  member_transaction_id uuid not null references public.member_transactions(id) on delete cascade,
  visit_number integer not null check (visit_number > 0),
  purchase_amount numeric(12,2) not null default 0 check (purchase_amount >= 0),
  visited_at timestamptz not null default now(),
  unique (member_transaction_id),
  unique (business_id, customer_id, visit_number),
  unique (program_id, id)
);

create table if not exists public.loyality_voucher_catalog (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  description text not null default '',
  voucher_kind text not null default 'item' check (voucher_kind in ('item', 'amount', 'discount')),
  voucher_value numeric(12,2),
  points_cost integer not null check (points_cost >= 0),
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, id),
  unique (business_id, id)
);

create table if not exists public.loyality_vouchers (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  public_token text not null default encode(gen_random_bytes(18), 'hex'),
  title text not null,
  description text not null default '',
  voucher_kind text not null default 'item' check (voucher_kind in ('item', 'amount', 'discount')),
  voucher_value numeric(12,2),
  status text not null default 'active' check (status in ('active', 'redeemed', 'cancelled')),
  source_kind text not null check (source_kind in ('acquisition_offer', 'referral', 'visit_rule', 'points_catalog', 'manual')),
  source_id uuid,
  source_event_id uuid,
  issued_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (public_token),
  unique (program_id, id),
  unique (business_id, id)
);

create unique index if not exists loyality_voucher_source_once_idx
  on public.loyality_vouchers (customer_id, source_kind, source_id, source_event_id)
  where source_id is not null and source_event_id is not null;

create table if not exists public.loyality_raffles (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  title text not null,
  prize_description text not null,
  minimum_purchase numeric(12,2) not null default 0 check (minimum_purchase >= 0),
  entries_per_purchase integer not null default 1 check (entries_per_purchase > 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  status text not null default 'active' check (status in ('draft', 'active', 'closed', 'cancelled')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, id),
  unique (business_id, id),
  check (ends_at > starts_at)
);

create table if not exists public.loyality_raffle_entries (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  raffle_id uuid not null references public.loyality_raffles(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  member_transaction_id uuid not null references public.member_transactions(id) on delete cascade,
  entry_count integer not null default 1 check (entry_count > 0),
  created_at timestamptz not null default now(),
  unique (raffle_id, member_transaction_id),
  unique (program_id, id)
);

create index if not exists loyality_offers_program_business_idx
  on public.loyality_offers (program_id, business_id, active, created_at desc);
create index if not exists loyality_claims_customer_idx
  on public.loyality_offer_claims (program_id, customer_id, claimed_at desc);
create index if not exists loyality_visits_customer_idx
  on public.loyality_visits (program_id, customer_id, visited_at desc);
create index if not exists loyality_vouchers_customer_idx
  on public.loyality_vouchers (program_id, customer_id, status, issued_at desc);
create index if not exists loyality_raffle_entries_customer_idx
  on public.loyality_raffle_entries (program_id, customer_id, created_at desc);

alter table public.loyality_business_settings enable row level security;
alter table public.loyality_offers enable row level security;
alter table public.loyality_offer_claims enable row level security;
alter table public.loyality_visit_rules enable row level security;
alter table public.loyality_visits enable row level security;
alter table public.loyality_voucher_catalog enable row level security;
alter table public.loyality_vouchers enable row level security;
alter table public.loyality_raffles enable row level security;
alter table public.loyality_raffle_entries enable row level security;

revoke all on table public.loyality_business_settings from public, anon, authenticated;
revoke all on table public.loyality_offers from public, anon, authenticated;
revoke all on table public.loyality_offer_claims from public, anon, authenticated;
revoke all on table public.loyality_visit_rules from public, anon, authenticated;
revoke all on table public.loyality_visits from public, anon, authenticated;
revoke all on table public.loyality_voucher_catalog from public, anon, authenticated;
revoke all on table public.loyality_vouchers from public, anon, authenticated;
revoke all on table public.loyality_raffles from public, anon, authenticated;
revoke all on table public.loyality_raffle_entries from public, anon, authenticated;

grant select on table public.loyality_offers to anon, authenticated;
grant select on table public.loyality_raffles to anon, authenticated;
grant select on table public.loyality_business_settings to authenticated;
grant select, insert, update, delete on table public.loyality_offer_claims to authenticated;
grant select, insert, update, delete on table public.loyality_visit_rules to authenticated;
grant select on table public.loyality_visits to authenticated;
grant select, insert, update, delete on table public.loyality_voucher_catalog to authenticated;
grant select, insert, update, delete on table public.loyality_vouchers to authenticated;
grant insert, update, delete on table public.loyality_offers to authenticated;
grant insert, update, delete on table public.loyality_raffles to authenticated;
grant select on table public.loyality_raffle_entries to authenticated;

create or replace function public.can_manage_loyality_business(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.can_manage_business(p_business_id)
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role::text = 'platform-admin'
    )
    or exists (
      select 1
      from public.businesses b
      join public.program_memberships pm
        on pm.program_id = b.program_id
       and pm.profile_id = (select auth.uid())
       and pm.role::text = 'program-admin'
       and pm.status::text = 'active'
      where b.id = p_business_id
    );
$$;

revoke all on function public.can_manage_loyality_business(uuid) from public, anon, authenticated;
grant execute on function public.can_manage_loyality_business(uuid) to authenticated;

create policy "Public can read active Loyality offers"
  on public.loyality_offers for select
  to anon, authenticated
  using (active and starts_at <= now() and (ends_at is null or ends_at > now()));
create policy "Business team manages Loyality offers"
  on public.loyality_offers for all
  to authenticated
  using (public.can_manage_loyality_business(business_id))
  with check (public.can_manage_loyality_business(business_id));

create policy "Business team reads Loyality settings"
  on public.loyality_business_settings for select
  to authenticated
  using (public.can_manage_loyality_business(business_id));
create policy "Members read their Loyality business settings"
  on public.loyality_business_settings for select
  to authenticated
  using (public.is_program_member(program_id, array['member'::public.program_role]));
create policy "Business team updates Loyality settings"
  on public.loyality_business_settings for update
  to authenticated
  using (public.can_manage_loyality_business(business_id))
  with check (public.can_manage_loyality_business(business_id));

create policy "Customers read own Loyality claims"
  on public.loyality_offer_claims for select
  to authenticated
  using (customer_id = (select auth.uid()));
create policy "Business team reads Loyality claims"
  on public.loyality_offer_claims for select
  to authenticated
  using (public.can_manage_loyality_business(business_id));

create policy "Business team manages Loyality visit rules"
  on public.loyality_visit_rules for all
  to authenticated
  using (public.can_manage_loyality_business(business_id))
  with check (public.can_manage_loyality_business(business_id));
create policy "Customers read active visit rules"
  on public.loyality_visit_rules for select
  to authenticated
  using (
    active and public.is_program_member(program_id, array['member'::public.program_role])
  );

create policy "Customers read own Loyality visits"
  on public.loyality_visits for select
  to authenticated
  using (customer_id = (select auth.uid()));
create policy "Business team reads Loyality visits"
  on public.loyality_visits for select
  to authenticated
  using (public.can_manage_loyality_business(business_id));

create policy "Members read active Loyality voucher catalog"
  on public.loyality_voucher_catalog for select
  to authenticated
  using (
    active and public.is_program_member(program_id, array['member'::public.program_role])
  );
create policy "Business team manages Loyality voucher catalog"
  on public.loyality_voucher_catalog for all
  to authenticated
  using (public.can_manage_loyality_business(business_id))
  with check (public.can_manage_loyality_business(business_id));

create policy "Customers read own Loyality vouchers"
  on public.loyality_vouchers for select
  to authenticated
  using (customer_id = (select auth.uid()));
create policy "Business team reads Loyality vouchers"
  on public.loyality_vouchers for select
  to authenticated
  using (public.can_manage_loyality_business(business_id));

create policy "Public can read active Loyality raffles"
  on public.loyality_raffles for select
  to anon, authenticated
  using (status = 'active' and starts_at <= now() and ends_at > now());
create policy "Business team manages Loyality raffles"
  on public.loyality_raffles for all
  to authenticated
  using (public.can_manage_loyality_business(business_id))
  with check (public.can_manage_loyality_business(business_id));

create policy "Customers read own Loyality raffle entries"
  on public.loyality_raffle_entries for select
  to authenticated
  using (customer_id = (select auth.uid()));
create policy "Business team reads Loyality raffle entries"
  on public.loyality_raffle_entries for select
  to authenticated
  using (public.can_manage_loyality_business(business_id));

create or replace function public.claim_loyality_offer(
  p_offer_token text,
  p_referrer_code text default null,
  p_source_label text default null
)
returns public.loyality_vouchers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_offer public.loyality_offers%rowtype;
  v_referrer_id uuid;
  v_claim public.loyality_offer_claims%rowtype;
  v_voucher public.loyality_vouchers%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Sign in as a customer to claim this offer.';
  end if;

  select * into v_offer
  from public.loyality_offers
  where public_token = pg_catalog.btrim(p_offer_token)
    and active
    and starts_at <= now()
    and (ends_at is null or ends_at > now());

  if v_offer.id is null then
    raise exception 'This offer is no longer available.';
  end if;

  if not public.is_program_member(v_offer.program_id, array['member'::public.program_role]) then
    raise exception 'This customer account does not belong to this Loyality program.';
  end if;

  if nullif(pg_catalog.btrim(p_referrer_code), '') is not null then
    select p.id into v_referrer_id
    from public.profiles p
    join public.program_memberships pm
      on pm.profile_id = p.id
     and pm.program_id = v_offer.program_id
     and pm.role::text = 'member'
     and pm.status::text = 'active'
    where p.referral_code = pg_catalog.upper(pg_catalog.btrim(p_referrer_code))
      and p.id <> v_actor_id
    limit 1;
  end if;

  insert into public.loyality_offer_claims (
    program_id, business_id, offer_id, customer_id, referrer_id, source_label
  ) values (
    v_offer.program_id,
    v_offer.business_id,
    v_offer.id,
    v_actor_id,
    v_referrer_id,
    coalesce(nullif(pg_catalog.btrim(p_source_label), ''), v_offer.source_label)
  )
  on conflict (offer_id, customer_id) do update
  set source_label = excluded.source_label
  returning * into v_claim;

  select * into v_voucher
  from public.loyality_vouchers
  where customer_id = v_actor_id
    and source_kind = 'acquisition_offer'
    and source_id = v_offer.id
    and source_event_id = v_claim.id
  limit 1;

  if v_voucher.id is null then
    insert into public.loyality_vouchers (
      program_id, business_id, customer_id, title, description,
      voucher_kind, voucher_value, source_kind, source_id, source_event_id
    ) values (
      v_offer.program_id,
      v_offer.business_id,
      v_actor_id,
      v_offer.reward_title,
      v_offer.reward_description,
      v_offer.reward_kind,
      v_offer.reward_value,
      'acquisition_offer',
      v_offer.id,
      v_claim.id
    ) returning * into v_voucher;
  end if;

  return v_voucher;
end;
$$;

revoke all on function public.claim_loyality_offer(text, text, text) from public, anon, authenticated;
grant execute on function public.claim_loyality_offer(text, text, text) to authenticated;

create or replace function public.redeem_loyality_voucher(p_public_token text)
returns public.loyality_vouchers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_voucher public.loyality_vouchers%rowtype;
  v_claim public.loyality_offer_claims%rowtype;
  v_settings public.loyality_business_settings%rowtype;
begin
  select * into v_voucher
  from public.loyality_vouchers
  where public_token = pg_catalog.btrim(p_public_token)
  for update;

  if v_voucher.id is null then
    raise exception 'Voucher not found.';
  end if;
  if not public.can_manage_loyality_business(v_voucher.business_id) then
    raise exception 'This staff account cannot redeem this voucher.';
  end if;
  if v_voucher.status <> 'active' then
    raise exception 'This voucher is not active.';
  end if;

  update public.loyality_vouchers
  set status = 'redeemed', redeemed_at = now(), redeemed_by = v_actor_id, updated_at = now()
  where id = v_voucher.id
  returning * into v_voucher;

  if v_voucher.source_kind = 'acquisition_offer' and v_voucher.source_event_id is not null then
    select * into v_claim
    from public.loyality_offer_claims
    where id = v_voucher.source_event_id
    for update;

    update public.loyality_offer_claims
    set status = 'redeemed', redeemed_at = now()
    where id = v_claim.id;

    if v_claim.referrer_id is not null and v_claim.referral_reward_issued_at is null then
      select * into v_settings
      from public.loyality_business_settings
      where business_id = v_claim.business_id;

      insert into public.loyality_vouchers (
        program_id, business_id, customer_id, title, description,
        voucher_kind, voucher_value, source_kind, source_id, source_event_id
      ) values (
        v_claim.program_id,
        v_claim.business_id,
        v_claim.referrer_id,
        coalesce(v_settings.referral_reward_title, 'Referral thank-you'),
        coalesce(v_settings.referral_reward_description, 'Thanks for introducing a new customer.'),
        coalesce(v_settings.referral_reward_kind, 'item'),
        v_settings.referral_reward_value,
        'referral',
        v_claim.offer_id,
        v_claim.id
      ) on conflict do nothing;

      update public.loyality_offer_claims
      set referral_reward_issued_at = now()
      where id = v_claim.id;
    end if;
  end if;

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  select
    v_voucher.program_id,
    v_actor_id,
    coalesce(nullif(p.full_name, ''), 'Business staff'),
    'Loyality voucher redeemed',
    pg_catalog.format('Redeemed "%s" for customer ID %s.', v_voucher.title, v_voucher.customer_id)
  from public.profiles p
  where p.id = v_actor_id;

  return v_voucher;
end;
$$;

revoke all on function public.redeem_loyality_voucher(text) from public, anon, authenticated;
grant execute on function public.redeem_loyality_voucher(text) to authenticated;

create or replace function public.redeem_loyality_catalog_voucher(
  p_catalog_id uuid,
  p_client_request_id uuid
)
returns public.loyality_vouchers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_catalog public.loyality_voucher_catalog%rowtype;
  v_balance public.reward_balances%rowtype;
  v_voucher public.loyality_vouchers%rowtype;
begin
  if v_actor_id is null then raise exception 'Sign in to choose a voucher.'; end if;
  if p_client_request_id is null then raise exception 'A request ID is required.'; end if;

  select * into v_catalog
  from public.loyality_voucher_catalog
  where id = p_catalog_id and active;
  if v_catalog.id is null then raise exception 'Voucher option not found.'; end if;
  if not public.is_program_member(v_catalog.program_id, array['member'::public.program_role]) then
    raise exception 'This customer account does not belong to this Loyality program.';
  end if;

  select * into v_voucher
  from public.loyality_vouchers
  where customer_id = v_actor_id
    and source_kind = 'points_catalog'
    and source_id = v_catalog.id
    and source_event_id = p_client_request_id
  limit 1;
  if v_voucher.id is not null then return v_voucher; end if;

  select * into v_balance
  from public.reward_balances
  where program_id = v_catalog.program_id and profile_id = v_actor_id
  for update;
  if v_balance.id is null or v_balance.points < v_catalog.points_cost then
    raise exception 'Not enough points for this voucher.';
  end if;

  update public.reward_balances
  set points = points - v_catalog.points_cost, updated_at = now()
  where id = v_balance.id;

  insert into public.loyality_vouchers (
    program_id, business_id, customer_id, title, description,
    voucher_kind, voucher_value, source_kind, source_id, source_event_id
  ) values (
    v_catalog.program_id,
    v_catalog.business_id,
    v_actor_id,
    v_catalog.title,
    v_catalog.description,
    v_catalog.voucher_kind,
    v_catalog.voucher_value,
    'points_catalog',
    v_catalog.id,
    p_client_request_id
  ) returning * into v_voucher;

  return v_voucher;
end;
$$;

revoke all on function public.redeem_loyality_catalog_voucher(uuid, uuid) from public, anon, authenticated;
grant execute on function public.redeem_loyality_catalog_voucher(uuid, uuid) to authenticated;

create or replace function public.process_loyality_member_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean := false;
  v_visit_number integer;
  v_rule public.loyality_visit_rules%rowtype;
  v_raffle public.loyality_raffles%rowtype;
begin
  select coalesce((feature_flags ->> 'loyalitySingleBusiness')::boolean, false)
  into v_enabled
  from public.programs
  where id = new.program_id;

  if not v_enabled then return new; end if;

  select count(*)::integer + 1 into v_visit_number
  from public.loyality_visits
  where business_id = new.business_id and customer_id = new.profile_id;

  insert into public.loyality_visits (
    program_id, business_id, customer_id, member_transaction_id,
    visit_number, purchase_amount, visited_at
  ) values (
    new.program_id, new.business_id, new.profile_id, new.id,
    v_visit_number, new.purchase_amount, new.created_at
  ) on conflict (member_transaction_id) do nothing;

  for v_rule in
    select * from public.loyality_visit_rules
    where program_id = new.program_id
      and business_id = new.business_id
      and active
      and v_visit_number >= trigger_visit_count
      and (
        v_visit_number = trigger_visit_count
        or (repeat_every is not null and pg_catalog.mod(v_visit_number - trigger_visit_count, repeat_every) = 0)
      )
  loop
    insert into public.loyality_vouchers (
      program_id, business_id, customer_id, title, description,
      voucher_kind, voucher_value, source_kind, source_id, source_event_id
    ) values (
      new.program_id, new.business_id, new.profile_id,
      v_rule.reward_title, v_rule.reward_description,
      v_rule.reward_kind, v_rule.reward_value,
      'visit_rule', v_rule.id, new.id
    ) on conflict do nothing;
  end loop;

  for v_raffle in
    select * from public.loyality_raffles
    where program_id = new.program_id
      and business_id = new.business_id
      and status = 'active'
      and starts_at <= new.created_at
      and ends_at > new.created_at
      and new.purchase_amount >= minimum_purchase
  loop
    insert into public.loyality_raffle_entries (
      program_id, business_id, raffle_id, customer_id,
      member_transaction_id, entry_count
    ) values (
      new.program_id, new.business_id, v_raffle.id, new.profile_id,
      new.id, v_raffle.entries_per_purchase
    ) on conflict (raffle_id, member_transaction_id) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists process_loyality_member_transaction on public.member_transactions;
create trigger process_loyality_member_transaction
after insert on public.member_transactions
for each row execute function public.process_loyality_member_transaction();

revoke all on function public.process_loyality_member_transaction() from public, anon, authenticated;

insert into public.loyality_business_settings (
  business_id, program_id, public_business_name, tagline,
  membership_tiers, referral_reward_title, referral_reward_kind,
  referral_reward_value, referral_reward_description
) values (
  '70000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000007',
  'Loyality Demo Business',
  'Turn every visit into the next one.',
  '[{"name":"Free","price":0,"benefits":["Member QR","Visit rewards","Referral offers"]},{"name":"Plus","price":10,"benefits":["$10 monthly voucher","Bonus perks","Priority offers"]}]'::jsonb,
  'Bring-a-friend thank-you',
  'amount',
  5,
  'A $5 voucher issued after your friend uses their first offer.'
)
on conflict (business_id) do update
set
  public_business_name = excluded.public_business_name,
  tagline = excluded.tagline,
  membership_tiers = excluded.membership_tiers,
  referral_reward_title = excluded.referral_reward_title,
  referral_reward_kind = excluded.referral_reward_kind,
  referral_reward_value = excluded.referral_reward_value,
  referral_reward_description = excluded.referral_reward_description,
  updated_at = now();

insert into public.loyality_offers (
  id, program_id, business_id, public_token, title, description,
  source_label, reward_title, reward_kind, reward_value, reward_description
) values (
  '71000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000007',
  '70000000-0000-4000-8000-000000000001',
  'loyality-welcome',
  'Your first visit starts here',
  'Claim this QR offer before your first visit.',
  'launch',
  'Welcome treat',
  'item',
  null,
  'One complimentary welcome item, selected by the business.'
)
on conflict (id) do nothing;

insert into public.loyality_visit_rules (
  id, program_id, business_id, name, trigger_visit_count, repeat_every,
  reward_title, reward_kind, reward_value, reward_description
) values
  (
    '72000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000001',
    'Second visit welcome-back', 2, null,
    'Second-visit bonus', 'item', null,
    'A complimentary item on visit number two.'
  ),
  (
    '72000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000001',
    'Classic seven-visit punch card', 7, 7,
    'Seven-visit reward', 'item', null,
    'A complimentary item every seventh visit.'
  )
on conflict (id) do nothing;

insert into public.loyality_voucher_catalog (
  id, program_id, business_id, title, description, voucher_kind, voucher_value, points_cost
) values
  (
    '73000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000001',
    'Signature item voucher',
    'Exchange points for one business-selected signature item.',
    'item', null, 100
  ),
  (
    '73000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000007',
    '70000000-0000-4000-8000-000000000001',
    '$10 visit voucher',
    'A one-purpose $10 voucher for a future visit.',
    'amount', 10, 250
  )
on conflict (id) do nothing;

insert into public.loyality_raffles (
  id, program_id, business_id, title, prize_description,
  minimum_purchase, entries_per_purchase, starts_at, ends_at, status
) values (
  '74000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000007',
  '70000000-0000-4000-8000-000000000001',
  'Monthly customer thank-you draw',
  'A business-selected monthly prize.',
  1,
  1,
  date_trunc('month', now()),
  date_trunc('month', now()) + interval '1 month',
  'active'
)
on conflict (id) do update
set
  title = excluded.title,
  prize_description = excluded.prize_description,
  minimum_purchase = excluded.minimum_purchase,
  entries_per_purchase = excluded.entries_per_purchase,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  status = excluded.status,
  updated_at = now();

notify pgrst, 'reload schema';
