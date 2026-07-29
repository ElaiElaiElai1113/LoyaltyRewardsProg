-- Use the zero-cost Vercel address as the verified canonical Pinas domain.
alter table public.program_domains disable trigger enforce_custom_domain_limit;

update public.program_domains
set
  hostname = 'pinas-rewards.vercel.app',
  is_primary = true,
  verification_status = 'verified',
  verified_at = now()
where program_id = '10000000-0000-4000-8000-000000000004'
  and is_primary;

alter table public.program_domains enable trigger enforce_custom_domain_limit;
