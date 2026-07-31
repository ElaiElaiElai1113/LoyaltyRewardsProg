-- Ownership was explicitly approved after the deployed application and DNS
-- for the exact apex hostname were verified. The www hostname is deliberately
-- not included in this authorization change.
alter table public.program_domains disable trigger enforce_custom_domain_limit;

update public.program_domains
set
  verification_status = 'verified',
  verified_at = coalesce(verified_at, now())
where program_id = '10000000-0000-4000-8000-000000000002'
  and hostname = 'guatemalarewards.com';

alter table public.program_domains enable trigger enforce_custom_domain_limit;
