create table if not exists public.business_applications (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete restrict,
  application_reference text not null unique,
  model text not null check (model in ('commission', 'credit')),
  legal_name text not null check (char_length(trim(legal_name)) between 2 and 140),
  dba text,
  industry text not null check (char_length(trim(industry)) between 2 and 100),
  street text not null check (char_length(trim(street)) between 2 and 180),
  city text not null check (char_length(trim(city)) between 2 and 100),
  region text not null check (char_length(trim(region)) between 2 and 100),
  postal text not null check (char_length(trim(postal)) between 1 and 30),
  country text not null check (char_length(trim(country)) between 2 and 100),
  website text,
  off_peak text,
  representative_name text not null check (char_length(trim(representative_name)) between 2 and 100),
  representative_title text not null check (char_length(trim(representative_title)) between 2 and 100),
  representative_email text not null check (representative_email ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'),
  representative_phone text not null check (char_length(trim(representative_phone)) between 7 and 50),
  reward_rate text not null,
  redemption_access text not null check (redemption_access in ('earn-and-redeem', 'earn-only')),
  credit_method text,
  disclosure_version text not null,
  contact_consent_at timestamptz not null,
  status text not null default 'submitted' check (status in ('submitted', 'in_review', 'approved', 'declined', 'withdrawn')),
  source_hostname text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_applications enable row level security;

revoke all on table public.business_applications from public, anon, authenticated;
grant select, insert, update, delete on table public.business_applications to service_role;

create index if not exists idx_business_applications_program_created
  on public.business_applications(program_id, created_at desc);
create index if not exists idx_business_applications_program_status
  on public.business_applications(program_id, status, created_at desc);

comment on table public.business_applications is
  'Server-only RewardMe and Wondertown business applications. No anonymous or authenticated table access.';
