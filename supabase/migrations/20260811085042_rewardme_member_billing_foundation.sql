-- RewardMe member billing schema foundation. Checkout and webhooks remain
-- disabled unless the server-only gate and the RewardMe program flag are both
-- enabled after commercial, legal, tax, refund, and reward-credit approval.

alter type public.membership_status add value if not exists 'pending';
alter type public.membership_status add value if not exists 'past_due';
alter type public.membership_status add value if not exists 'unpaid';

alter table public.memberships
  add column if not exists tier text not null default 'regular'
    check (tier in ('regular', 'gold')),
  add column if not exists provider_status text not null default 'mock',
  add column if not exists provider_price_id text,
  add column if not exists stripe_customer_id text,
  add column if not exists billing_email text;

create index if not exists memberships_stripe_subscription_idx
  on public.memberships (provider_subscription_id)
  where provider = 'stripe' and provider_subscription_id is not null;
create index if not exists memberships_stripe_customer_idx
  on public.memberships (stripe_customer_id)
  where provider = 'stripe' and stripe_customer_id is not null;

create table public.stripe_member_webhook_events (
  id text primary key,
  event_type text not null,
  program_id uuid references public.programs(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_member_webhook_events enable row level security;
revoke all on table public.stripe_member_webhook_events from anon, authenticated;

update public.programs
set feature_flags = feature_flags || '{"memberBilling":false}'::jsonb,
    updated_at = now()
where slug = 'pinas';
