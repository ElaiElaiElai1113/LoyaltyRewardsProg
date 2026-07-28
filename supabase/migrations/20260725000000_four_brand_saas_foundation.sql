-- White-label rewards programs. Profiles remain global identities; all operational
-- records belong to a program and balances/memberships are program-specific.

create type public.program_status as enum ('draft', 'active', 'suspended', 'archived');
create type public.program_role as enum ('program-admin', 'member', 'business-owner', 'business-staff');
create type public.program_membership_status as enum ('invited', 'active', 'suspended');
create type public.program_subscription_status as enum (
  'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.program_status not null default 'draft',
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  locale text not null default 'en-US',
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'UTC',
  primary_color text not null default '#176b5b',
  accent_color text not null default '#f2b134',
  logo_url text,
  support_email text not null default '',
  map_latitude numeric,
  map_longitude numeric,
  feature_flags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_domains (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  hostname text not null unique check (hostname = lower(hostname)),
  is_primary boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'failed')),
  verification_token uuid not null default gen_random_uuid(),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index program_domains_one_primary
  on public.program_domains (program_id) where is_primary;

create table public.program_settings (
  program_id uuid primary key references public.programs(id) on delete cascade,
  reward_name text not null default 'Rewards',
  default_earn_rate numeric not null default 10 check (default_earn_rate >= 0),
  membership_price_cents integer not null default 2500 check (membership_price_cents >= 0),
  referral_bonus integer not null default 0 check (referral_bonus >= 0),
  legal_content jsonb not null default '{}'::jsonb,
  email_from_name text not null default '',
  email_from_address text not null default '',
  updated_at timestamptz not null default now()
);

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  stripe_price_id text unique,
  active boolean not null default true,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'USD',
  interval text not null default 'month' check (interval in ('month', 'year')),
  entitlements jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.program_subscriptions (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null unique references public.programs(id) on delete cascade,
  plan_id uuid references public.subscription_plans(id) on delete restrict,
  status public.program_subscription_status not null default 'incomplete',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.program_memberships (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.program_role not null,
  status public.program_membership_status not null default 'active',
  business_id uuid references public.businesses(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_memberships_business_role_check check (
    (role in ('business-owner', 'business-staff') and business_id is not null)
    or (role in ('program-admin', 'member') and business_id is null)
  )
);

create unique index program_memberships_identity_role_key
  on public.program_memberships (
    program_id, profile_id, role, coalesce(business_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

insert into public.programs (
  id, name, slug, status, country_code, locale, currency, timezone,
  primary_color, accent_color, logo_url, support_email, map_latitude, map_longitude
) values
  ('10000000-0000-4000-8000-000000000001', 'Medellin Rewards', 'medellin', 'active', 'CO', 'es-CO', 'USD', 'America/Bogota', '#9c6a22', '#d8972c', '/medellin-rewards-logo.svg', 'support@medellinrewards.com', 6.2442, -75.5812),
  ('10000000-0000-4000-8000-000000000002', 'Guatemala Rewards', 'guatemala', 'active', 'GT', 'es-GT', 'GTQ', 'America/Guatemala', '#176b5b', '#f2b134', null, 'support@guatemalarewards.com', 14.6349, -90.5069),
  ('10000000-0000-4000-8000-000000000003', 'Synergize', 'synergize', 'active', 'US', 'en-US', 'USD', 'America/New_York', '#2357a5', '#e45b3f', null, 'support@synergize.example', 40.7128, -74.0060),
  ('10000000-0000-4000-8000-000000000004', 'Davao Rewards', 'davao', 'active', 'PH', 'en-PH', 'PHP', 'Asia/Manila', '#176b45', '#f4c542', null, 'support@davaorewards.com', 7.1907, 125.4553);

insert into public.program_domains (program_id, hostname, is_primary, verification_status, verified_at)
values
  ('10000000-0000-4000-8000-000000000001', 'medellinrewards.com', true, 'verified', now()),
  ('10000000-0000-4000-8000-000000000002', 'guatemalarewards.com', true, 'pending', null),
  ('10000000-0000-4000-8000-000000000003', 'synergize.example', true, 'pending', null),
  ('10000000-0000-4000-8000-000000000004', 'davaorewards.com', true, 'pending', null);

insert into public.program_settings (program_id, email_from_name, email_from_address)
select id, name, support_email from public.programs;

insert into public.subscription_plans (code, name, price_cents, entitlements) values
  ('launch', 'Launch', 9900, '{"administrators":2,"businesses":10,"members":1000,"storageMb":2048,"customDomains":1,"features":{"giftCards":true,"referrals":true}}'),
  ('growth', 'Growth', 24900, '{"administrators":10,"businesses":100,"members":10000,"storageMb":10240,"customDomains":3,"features":{"giftCards":true,"referrals":true,"exports":true}}'),
  ('scale', 'Scale', 59900, '{"administrators":50,"businesses":1000,"members":100000,"storageMb":51200,"customDomains":10,"features":{"giftCards":true,"referrals":true,"exports":true,"prioritySupport":true}}');

-- Add program ownership additively. Medellin is the compatibility default for
-- existing RPCs until each RPC is upgraded to derive the program from membership.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'businesses', 'reward_balances', 'rewards', 'products', 'orders',
    'order_line_items', 'promotions', 'activities', 'redemptions', 'admin_logs',
    'credit_redemptions', 'partner_referrers', 'partner_referrals',
    'partner_credit_ledger', 'gift_card_catalog', 'gift_cards', 'gift_card_events',
    'memberships', 'ambassador_leads', 'early_access_leads', 'agreement_versions',
    'agreement_acceptances', 'member_transactions'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'alter table public.%I add column if not exists program_id uuid references public.programs(id) on delete restrict default %L::uuid',
        table_name, '10000000-0000-4000-8000-000000000001'
      );
      execute format('update public.%I set program_id = %L::uuid where program_id is null', table_name, '10000000-0000-4000-8000-000000000001');
      execute format('alter table public.%I alter column program_id set not null', table_name);
      execute format('create index if not exists %I on public.%I (program_id)', 'idx_' || table_name || '_program_id', table_name);
    end if;
  end loop;
end $$;

alter table public.reward_balances drop constraint if exists reward_balances_profile_id_key;
alter table public.reward_balances
  add constraint reward_balances_program_profile_key unique (program_id, profile_id);
alter table public.memberships drop constraint if exists memberships_profile_id_key;
alter table public.memberships
  add constraint memberships_program_profile_key unique (program_id, profile_id);

-- Profiles are global identities. Backfill their current application role into
-- the Medellin program while preserving platform-admin as a global role.
insert into public.program_memberships (program_id, profile_id, role, business_id)
select
  '10000000-0000-4000-8000-000000000001',
  p.id,
  case p.role::text
    when 'business-owner' then 'business-owner'::public.program_role
    when 'business-staff' then 'business-staff'::public.program_role
    else 'member'::public.program_role
  end,
  p.business_id
from public.profiles p
where p.role::text <> 'platform-admin'
on conflict do nothing;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role::text = 'platform-admin'
  );
$$;

create or replace function public.is_program_member(
  p_program_id uuid,
  p_roles public.program_role[] default null
) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_platform_admin() or exists (
    select 1
    from public.program_memberships pm
    where pm.profile_id = auth.uid()
      and pm.program_id = p_program_id
      and pm.status = 'active'
      and (p_roles is null or pm.role = any(p_roles))
  );
$$;

create or replace function public.resolve_program_by_hostname(p_hostname text)
returns setof public.programs
language sql stable security definer set search_path = public as $$
  select p.*
  from public.programs p
  join public.program_domains d on d.program_id = p.id
  where d.hostname = lower(split_part(p_hostname, ':', 1))
    and d.verification_status = 'verified'
    and p.status = 'active'
  limit 1;
$$;

grant execute on function public.resolve_program_by_hostname(text) to anon, authenticated;
grant execute on function public.is_program_member(uuid, public.program_role[]) to authenticated;

-- Catalogs remain publicly readable, but every authenticated mutation must stay
-- inside a program the actor administers or operates.
do $$
declare
  table_name text;
begin
  foreach table_name in array array['businesses', 'products', 'rewards', 'promotions', 'gift_card_catalog']
  loop
    execute format(
      'create policy %I on public.%I as restrictive for insert to authenticated with check (public.is_program_member(program_id))',
      'tenant insert isolation', table_name
    );
    execute format(
      'create policy %I on public.%I as restrictive for update to authenticated using (public.is_program_member(program_id)) with check (public.is_program_member(program_id))',
      'tenant update isolation', table_name
    );
    execute format(
      'create policy %I on public.%I as restrictive for delete to authenticated using (public.is_program_member(program_id))',
      'tenant delete isolation', table_name
    );
  end loop;
end $$;

alter table public.programs enable row level security;
alter table public.program_domains enable row level security;
alter table public.program_settings enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.program_subscriptions enable row level security;
alter table public.program_memberships enable row level security;

create policy "active programs are public" on public.programs for select
  using (status = 'active' or public.is_platform_admin() or public.is_program_member(id));
create policy "platform admins manage programs" on public.programs for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "members read their program domains" on public.program_domains for select
  using (public.is_program_member(program_id));
create policy "program admins manage domains" on public.program_domains for all
  using (public.is_program_member(program_id, array['program-admin']::public.program_role[]))
  with check (public.is_program_member(program_id, array['program-admin']::public.program_role[]));
create policy "members read program settings" on public.program_settings for select
  using (public.is_program_member(program_id));
create policy "program admins manage settings" on public.program_settings for all
  using (public.is_program_member(program_id, array['program-admin']::public.program_role[]))
  with check (public.is_program_member(program_id, array['program-admin']::public.program_role[]));
create policy "active plans are public" on public.subscription_plans for select using (active);
create policy "platform admins manage plans" on public.subscription_plans for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "admins read subscriptions" on public.program_subscriptions for select
  using (public.is_platform_admin() or public.is_program_member(program_id, array['program-admin']::public.program_role[]));
create policy "platform admins manage subscriptions" on public.program_subscriptions for all
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy "users read program memberships" on public.program_memberships for select
  using (profile_id = auth.uid() or public.is_program_member(program_id, array['program-admin']::public.program_role[]));
create policy "program admins manage memberships" on public.program_memberships for all
  using (public.is_program_member(program_id, array['program-admin']::public.program_role[]))
  with check (public.is_program_member(program_id, array['program-admin']::public.program_role[]));

create or replace function public.create_program(
  p_name text,
  p_slug text,
  p_country_code text,
  p_locale text,
  p_currency text,
  p_timezone text,
  p_plan_code text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_program_id uuid;
  v_plan_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select id into v_plan_id from public.subscription_plans where code = p_plan_code and active;
  if v_plan_id is null then raise exception 'invalid_plan'; end if;

  insert into public.programs (name, slug, country_code, locale, currency, timezone)
  values (trim(p_name), lower(trim(p_slug)), upper(p_country_code), p_locale, upper(p_currency), p_timezone)
  returning id into v_program_id;

  insert into public.program_settings (program_id, email_from_name) values (v_program_id, trim(p_name));
  insert into public.program_memberships (program_id, profile_id, role)
  values (v_program_id, auth.uid(), 'program-admin');
  insert into public.program_domains (program_id, hostname, is_primary)
  values (v_program_id, lower(trim(p_slug)) || '.rewardsplatform.app', true);
  insert into public.program_subscriptions (program_id, plan_id) values (v_program_id, v_plan_id);
  return v_program_id;
end $$;

grant execute on function public.create_program(text, text, text, text, text, text, text) to authenticated;

create or replace function public.assign_new_profile_to_program()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_program_id uuid;
begin
  select p.id into v_program_id
  from auth.users u
  join public.programs p
    on p.id = coalesce(
      nullif(u.raw_user_meta_data ->> 'active_program_id', '')::uuid,
      '10000000-0000-4000-8000-000000000001'::uuid
    )
  where u.id = new.id and p.status in ('draft', 'active');

  v_program_id := coalesce(v_program_id, '10000000-0000-4000-8000-000000000001'::uuid);
  if new.role::text <> 'platform-admin' then
    insert into public.program_memberships (program_id, profile_id, role, business_id)
    values (
      v_program_id,
      new.id,
      case new.role::text
        when 'business-owner' then 'business-owner'::public.program_role
        when 'business-staff' then 'business-staff'::public.program_role
        else 'member'::public.program_role
      end,
      new.business_id
    ) on conflict do nothing;
  end if;
  return new;
end $$;

create or replace function public.assign_new_balance_to_program()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  select coalesce(
    nullif(u.raw_user_meta_data ->> 'active_program_id', '')::uuid,
    '10000000-0000-4000-8000-000000000001'::uuid
  ) into new.program_id
  from auth.users u where u.id = new.profile_id;
  new.program_id := coalesce(new.program_id, '10000000-0000-4000-8000-000000000001'::uuid);
  return new;
end $$;

create trigger assign_new_profile_program
after insert on public.profiles
for each row execute function public.assign_new_profile_to_program();
create trigger assign_new_balance_program
before insert on public.reward_balances
for each row execute function public.assign_new_balance_to_program();

-- Restrictive policies compose with the legacy per-role policies, preventing
-- authenticated access to sensitive rows outside the user's current programs.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'reward_balances', 'orders', 'activities', 'redemptions',
    'credit_redemptions', 'memberships', 'agreement_acceptances',
    'member_transactions', 'partner_referrals', 'partner_credit_ledger'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format(
        'create policy %I on public.%I as restrictive for all to authenticated using (public.is_program_member(program_id)) with check (public.is_program_member(program_id))',
        'tenant isolation', table_name
      );
    end if;
  end loop;
end $$;

create trigger programs_updated_at before update on public.programs
for each row execute function public.handle_updated_at();
create trigger program_settings_updated_at before update on public.program_settings
for each row execute function public.handle_updated_at();
create trigger program_subscriptions_updated_at before update on public.program_subscriptions
for each row execute function public.handle_updated_at();
create trigger program_memberships_updated_at before update on public.program_memberships
for each row execute function public.handle_updated_at();
