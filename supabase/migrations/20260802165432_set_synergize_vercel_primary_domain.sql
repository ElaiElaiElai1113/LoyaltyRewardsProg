-- Replace the non-routable seed placeholder with the zero-cost Vercel
-- hostname attached to the shared rewards application. Updating in place
-- preserves the tenant's single-domain allowance.
alter table public.program_domains disable trigger enforce_custom_domain_limit;

update public.program_domains
set
  hostname = 'synergize-rewards.vercel.app',
  is_primary = true,
  verification_status = 'verified',
  verified_at = coalesce(verified_at, now())
where program_id = (select id from public.programs where slug = 'synergize')
  and is_primary
  and hostname in ('synergize.example', 'synergize-rewards.vercel.app');

alter table public.program_domains enable trigger enforce_custom_domain_limit;
