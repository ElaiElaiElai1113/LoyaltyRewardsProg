-- This replaces the existing hostname in place. The limit trigger counts the
-- pre-update row and would otherwise treat the rename as a second domain.
alter table public.program_domains disable trigger enforce_custom_domain_limit;

update public.program_domains
set
  hostname = 'www.medellinrewards.com',
  verification_status = 'verified',
  verified_at = coalesce(verified_at, now())
where program_id = '10000000-0000-4000-8000-000000000001'
  and hostname = 'medellinrewards.com';

alter table public.program_domains enable trigger enforce_custom_domain_limit;
