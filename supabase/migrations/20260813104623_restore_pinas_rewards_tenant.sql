-- Restore Pinas Rewards as an independent tenant after RewardMe became a
-- separate flagship brand. RewardMe keeps its stable program UUID and data;
-- Pinas Rewards receives a new UUID so tenant-scoped records cannot mix.
insert into public.programs (
  id,
  name,
  slug,
  status,
  country_code,
  locale,
  currency,
  timezone,
  primary_color,
  accent_color,
  logo_url,
  support_email,
  map_latitude,
  map_longitude,
  feature_flags
) values (
  '10000000-0000-4000-8000-000000000006',
  'Pinas Rewards',
  'pinasrewards',
  'active',
  'PH',
  'en-PH',
  'PHP',
  'Asia/Manila',
  '#a67608',
  '#d9ad20',
  '/pinas-rewards-mark.svg',
  'support@pinasrewards.ph',
  12.8797,
  121.7740,
  '{}'::jsonb
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
  updated_at = now();

insert into public.program_settings (
  program_id,
  reward_name,
  default_earn_rate,
  membership_price_cents,
  referral_bonus,
  email_from_name,
  email_from_address
)
select
  p.id,
  'Rewards',
  10,
  1000,
  100,
  'Pinas Rewards',
  'support@pinasrewards.ph'
from public.programs p
where p.slug = 'pinasrewards'
on conflict (program_id) do update
set
  reward_name = excluded.reward_name,
  default_earn_rate = excluded.default_earn_rate,
  membership_price_cents = excluded.membership_price_cents,
  referral_bonus = excluded.referral_bonus,
  email_from_name = excluded.email_from_name,
  email_from_address = excluded.email_from_address,
  updated_at = now();

-- The launch entitlement enables the tenant's first verified hostname without
-- adding any external billing provider or payment record.
insert into public.program_subscriptions (program_id, plan_id, status)
select
  p.id,
  sp.id,
  'trialing'::public.program_subscription_status
from public.programs p
cross join public.subscription_plans sp
where p.slug = 'pinasrewards'
  and sp.code = 'launch'
on conflict (program_id) do update
set
  plan_id = excluded.plan_id,
  status = 'trialing'::public.program_subscription_status,
  stripe_customer_id = null,
  stripe_subscription_id = null,
  updated_at = now();

insert into public.program_domains (
  program_id,
  hostname,
  is_primary,
  verification_status,
  verified_at
)
select
  p.id,
  'pinas-rewards.vercel.app',
  true,
  'verified',
  now()
from public.programs p
where p.slug = 'pinasrewards'
on conflict (hostname) do update
set
  program_id = excluded.program_id,
  is_primary = excluded.is_primary,
  verification_status = excluded.verification_status,
  verified_at = excluded.verified_at;
