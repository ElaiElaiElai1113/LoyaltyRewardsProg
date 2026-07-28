-- Manual emergency containment for migration 20260728000000.
-- Preserves all tenant and financial data. Review before execution.
begin;
drop trigger if exists enforce_custom_domain_limit on public.program_domains;
drop trigger if exists enforce_business_limit on public.businesses;
drop trigger if exists enforce_member_limit on public.program_memberships;
drop policy if exists "Onboarding uploads program-scoped verification IDs" on storage.objects;
drop policy if exists "Members view attached verification IDs" on storage.objects;
drop policy if exists "Program admins view tenant verification IDs" on storage.objects;
drop policy if exists "Platform admins view all verification IDs" on storage.objects;
-- Restore previously approved storage policies before commit if document access is required.
commit;
