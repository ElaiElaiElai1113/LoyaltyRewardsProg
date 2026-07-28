-- Manual emergency containment for migration 20260730000000.
-- The import table and audit evidence are intentionally retained.
begin;
revoke execute on function public.request_program_domain(uuid, text) from authenticated;
revoke execute on function public.set_primary_program_domain(uuid, uuid) from authenticated;
revoke execute on function public.set_program_member_status(uuid, uuid, public.program_membership_status) from authenticated;
revoke execute on function public.create_tenant_import_batch(uuid, uuid, text, jsonb) from authenticated;
commit;
