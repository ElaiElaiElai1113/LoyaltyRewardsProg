-- Move RewardMe's canonical tenant metadata away from the legacy public brand.
-- The old Vercel hostname remains an application-level redirect so bookmarks work.
update public.programs
set
  support_email = 'support@rewardme.ph',
  updated_at = now()
where id = '10000000-0000-4000-8000-000000000004'
  and name = 'RewardMe';

update public.program_settings
set
  email_from_name = 'RewardMe',
  email_from_address = ''
where program_id = '10000000-0000-4000-8000-000000000004';

alter table public.program_domains disable trigger enforce_custom_domain_limit;

update public.program_domains
set
  hostname = 'loyalty-rewards-prog.vercel.app',
  is_primary = true,
  verification_status = 'verified',
  verified_at = now()
where program_id = '10000000-0000-4000-8000-000000000004'
  and is_primary;

alter table public.program_domains enable trigger enforce_custom_domain_limit;
