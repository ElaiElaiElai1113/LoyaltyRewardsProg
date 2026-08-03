-- A permanent fictional tenant for safe sales demonstrations and end-to-end QA.
-- Wondertown uses the shared platform schema but keeps every operational record
-- isolated by program_id like the other white-label programs.
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
  '10000000-0000-4000-8000-000000000005',
  'Wondertown Rewards',
  'wondertown',
  'active',
  'US',
  'en-US',
  'USD',
  'America/New_York',
  '#4f3b78',
  '#e57267',
  '/wondertown-rewards-logo.svg',
  'support@wondertown.test',
  39.8283,
  -98.5795,
  '{"demoTenant":true}'::jsonb
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
  'Sparks',
  10,
  0,
  100,
  'Wondertown Rewards',
  'support@wondertown.test'
from public.programs p
where p.slug = 'wondertown'
on conflict (program_id) do update
set
  reward_name = excluded.reward_name,
  default_earn_rate = excluded.default_earn_rate,
  membership_price_cents = excluded.membership_price_cents,
  referral_bonus = excluded.referral_bonus,
  email_from_name = excluded.email_from_name,
  email_from_address = excluded.email_from_address,
  updated_at = now();

-- "trialing" is the established internal, non-Stripe launch allowance. This
-- does not create a Stripe customer, payment method, or external subscription.
insert into public.program_subscriptions (program_id, plan_id, status)
select
  p.id,
  sp.id,
  'trialing'::public.program_subscription_status
from public.programs p
cross join public.subscription_plans sp
where p.slug = 'wondertown'
  and sp.code = 'launch'
on conflict (program_id) do update
set
  plan_id = excluded.plan_id,
  status = 'trialing'::public.program_subscription_status,
  stripe_customer_id = null,
  stripe_subscription_id = null,
  updated_at = now();

-- Domain limits are enforced by a trigger, so the subscription entitlement
-- must exist before registering the tenant's first verified hostname.
insert into public.program_domains (
  program_id,
  hostname,
  is_primary,
  verification_status,
  verified_at
)
select
  p.id,
  'wondertown-rewards.vercel.app',
  true,
  'verified',
  now()
from public.programs p
where p.slug = 'wondertown'
on conflict (hostname) do update
set
  program_id = excluded.program_id,
  is_primary = excluded.is_primary,
  verification_status = excluded.verification_status,
  verified_at = excluded.verified_at;
