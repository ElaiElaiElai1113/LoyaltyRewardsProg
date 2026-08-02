-- PostgREST exposes modern JWTs through request.jwt.claims. Keep the legacy
-- scalar setting as a compatibility fallback, but do not depend on it: newer
-- hosted runtimes leave it empty, which previously caused legitimate
-- service-role writes to fail with authentication_required.

create or replace function public.enforce_tenant_write_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_program_id uuid;
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
begin
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

create or replace function public.enforce_program_resource_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
  v_limit integer;
  v_count integer;
  v_resource text := tg_argv[0];
begin
  if v_role = 'service_role' or session_user = 'supabase_auth_admin' then
    return new;
  end if;

  v_limit := coalesce(
    (public.get_program_entitlements_internal(new.program_id) ->> v_resource)::integer,
    0
  );

  if v_resource = 'customDomains' then
    if new.hostname like '%.rewardsplatform.app' then return new; end if;
    select count(*) into v_count from public.program_domains
    where program_id = new.program_id
      and hostname not like '%.rewardsplatform.app'
      and id <> new.id;
  elsif v_resource = 'businesses' then
    select count(*) into v_count from public.businesses
    where program_id = new.program_id and id <> new.id;
  elsif v_resource = 'members' then
    if new.role <> 'member' or new.status = 'suspended' then return new; end if;
    select count(*) into v_count from public.program_memberships
    where program_id = new.program_id
      and role = 'member'
      and status in ('active', 'invited')
      and id <> new.id;
  else
    raise exception 'unknown_program_resource';
  end if;

  if v_count >= v_limit then
    raise exception '%_limit_reached', lower(v_resource);
  end if;
  return new;
end;
$$;

create or replace function public.enforce_program_feature()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    ''
  );
  v_program_id uuid := case when tg_op = 'DELETE' then old.program_id else new.program_id end;
  v_feature text := tg_argv[0];
  v_enabled boolean;
begin
  if v_role = 'service_role' or session_user = 'supabase_auth_admin' then
    return coalesce(new, old);
  end if;
  v_enabled := coalesce(
    (public.get_program_entitlements_internal(v_program_id) -> 'features' ->> v_feature)::boolean,
    false
  );
  if not v_enabled then raise exception 'feature_not_enabled:%', v_feature; end if;
  return coalesce(new, old);
end;
$$;
