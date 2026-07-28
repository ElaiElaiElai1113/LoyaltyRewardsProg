-- Supabase Auth inserts profiles and their initial zero balance through the
-- internal supabase_auth_admin role before an end-user JWT exists.
create or replace function public.enforce_tenant_write_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
  v_role text;
begin
  v_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  if v_role = 'service_role' or session_user = 'supabase_auth_admin' then
    return coalesce(new, old);
  end if;

  v_program_id := case when tg_op = 'DELETE' then old.program_id else new.program_id end;
  if v_program_id is null then
    raise exception 'program_required';
  end if;
  if auth.uid() is null then
    raise exception 'authentication_required';
  end if;
  if not public.is_program_member(v_program_id) then
    raise exception 'cross_program_access_denied';
  end if;
  return coalesce(new, old);
end;
$$;
