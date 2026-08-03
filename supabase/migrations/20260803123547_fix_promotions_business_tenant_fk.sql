-- Hosted production retained the original promotion foreign key to
-- business_branding even after promotions became part of the shared tenant
-- catalog. No promotions can be created for current businesses under that
-- contract. Point the relationship at the canonical program-scoped business
-- identity used by every owner/admin RPC and by the other catalog tables.
alter table public.promotions
  drop constraint if exists promotions_business_id_fkey;

alter table public.promotions
  drop constraint if exists promotions_business_program_fkey;

alter table public.promotions
  add constraint promotions_business_program_fkey
  foreign key (business_id, program_id)
  references public.businesses (id, program_id)
  on delete cascade
  not valid;

alter table public.promotions
  validate constraint promotions_business_program_fkey;
