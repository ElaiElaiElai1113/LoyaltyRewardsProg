-- Promote the Philippines-wide program as the flagship Pinas Rewards brand.
update public.programs
set
  name = 'Pinas Rewards',
  slug = 'pinas',
  primary_color = '#a67608',
  accent_color = '#d9ad20',
  logo_url = '/pinas-rewards-logo.svg',
  support_email = 'support@pinasrewards.ph',
  map_latitude = 12.8797,
  map_longitude = 121.7740
where id = '10000000-0000-4000-8000-000000000004';

-- This is an in-place rename, not an additional custom domain. The resource
-- limit trigger counts rows before UPDATE and would otherwise reject it.
alter table public.program_domains disable trigger enforce_custom_domain_limit;

update public.program_domains
set hostname = 'pinasrewards.ph'
where program_id = '10000000-0000-4000-8000-000000000004'
  and hostname = 'davaorewards.com';

alter table public.program_domains enable trigger enforce_custom_domain_limit;

update public.program_settings
set
  email_from_name = 'Pinas Rewards',
  email_from_address = 'support@pinasrewards.ph'
where program_id = '10000000-0000-4000-8000-000000000004';
