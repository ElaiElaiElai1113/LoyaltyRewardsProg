-- Keep the four public tenant identities isolated from one another.
-- These values are intentionally reconciled by immutable program id so a
-- custom-domain or slug change cannot copy another tenant's visual identity.
update public.programs
set
  name = 'Medellin Rewards',
  slug = 'medellin',
  primary_color = '#9c6a22',
  accent_color = '#d8972c',
  logo_url = '/medellin-rewards-logo.svg',
  support_email = 'support@medellinrewards.com',
  updated_at = now()
where id = '10000000-0000-4000-8000-000000000001';

update public.programs
set
  name = 'Guatemala Rewards',
  slug = 'guatemala',
  primary_color = '#176b5b',
  accent_color = '#f2b134',
  support_email = 'support@guatemalarewards.com',
  updated_at = now()
where id = '10000000-0000-4000-8000-000000000002';

update public.programs
set
  name = 'Synergize',
  slug = 'synergize',
  primary_color = '#2357a5',
  accent_color = '#e45b3f',
  support_email = 'support@synergizerewards.com',
  updated_at = now()
where id = '10000000-0000-4000-8000-000000000003';

update public.programs
set
  name = 'Pinas Rewards',
  slug = 'pinas',
  primary_color = '#a67608',
  accent_color = '#d9ad20',
  support_email = 'support@pinasrewards.ph',
  updated_at = now()
where id = '10000000-0000-4000-8000-000000000004';
