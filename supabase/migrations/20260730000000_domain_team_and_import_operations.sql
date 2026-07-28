-- Approval-gated tenant operations. These RPCs keep domain, team, and import
-- mutations behind program-admin authorization and auditable batch records.

create type public.tenant_import_status as enum ('draft', 'validated', 'running', 'completed', 'failed', 'rolled_back');

create table public.tenant_import_batches (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete restrict,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  idempotency_key uuid not null,
  status public.tenant_import_status not null default 'draft',
  source_filename text not null,
  manifest jsonb not null default '{}'::jsonb,
  reconciliation jsonb not null default '{}'::jsonb,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, idempotency_key)
);

alter table public.tenant_import_batches enable row level security;
create policy "program admins read import batches" on public.tenant_import_batches for select
  using (public.is_program_member(program_id, array['program-admin']::public.program_role[]));

create or replace function public.request_program_domain(p_program_id uuid, p_hostname text)
returns public.program_domains
language plpgsql security definer set search_path = public as $$
declare
  v_hostname text := lower(trim(regexp_replace(p_hostname, '^https?://', '')));
  v_domain public.program_domains;
begin
  v_hostname := split_part(v_hostname, '/', 1);
  if not public.is_program_member(p_program_id, array['program-admin']::public.program_role[]) then
    raise exception 'program_admin_required';
  end if;
  if v_hostname !~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$' then
    raise exception 'invalid_hostname';
  end if;
  insert into public.program_domains (program_id, hostname, is_primary)
  values (p_program_id, v_hostname, false)
  returning * into v_domain;
  return v_domain;
end;
$$;

create or replace function public.set_primary_program_domain(p_program_id uuid, p_domain_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_program_member(p_program_id, array['program-admin']::public.program_role[]) then
    raise exception 'program_admin_required';
  end if;
  if not exists (
    select 1 from public.program_domains
    where id = p_domain_id and program_id = p_program_id and verification_status = 'verified'
  ) then raise exception 'verified_domain_required'; end if;
  update public.program_domains set is_primary = false where program_id = p_program_id and is_primary;
  update public.program_domains set is_primary = true where id = p_domain_id and program_id = p_program_id;
end;
$$;

create or replace function public.set_program_member_status(
  p_program_id uuid,
  p_membership_id uuid,
  p_status public.program_membership_status
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_membership public.program_memberships;
  v_active_admins integer;
begin
  if not public.is_program_member(p_program_id, array['program-admin']::public.program_role[]) then
    raise exception 'program_admin_required';
  end if;
  select * into v_membership from public.program_memberships
  where id = p_membership_id and program_id = p_program_id for update;
  if v_membership.id is null then raise exception 'membership_not_found'; end if;
  if v_membership.role = 'program-admin' and p_status = 'suspended' then
    select count(*) into v_active_admins from public.program_memberships
    where program_id = p_program_id and role = 'program-admin' and status = 'active';
    if v_active_admins <= 1 then raise exception 'last_program_admin'; end if;
  end if;
  update public.program_memberships set status = p_status, updated_at = now()
  where id = p_membership_id;
end;
$$;

create or replace function public.create_tenant_import_batch(
  p_program_id uuid,
  p_idempotency_key uuid,
  p_source_filename text,
  p_manifest jsonb
) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_batch_id uuid;
begin
  if not public.is_program_member(p_program_id, array['program-admin']::public.program_role[]) then
    raise exception 'program_admin_required';
  end if;
  insert into public.tenant_import_batches (
    program_id, requested_by, idempotency_key, source_filename, manifest
  ) values (
    p_program_id, auth.uid(), p_idempotency_key, trim(p_source_filename), coalesce(p_manifest, '{}'::jsonb)
  )
  on conflict (program_id, idempotency_key)
  do update set source_filename = excluded.source_filename
  returning id into v_batch_id;
  return v_batch_id;
end;
$$;

grant execute on function public.request_program_domain(uuid, text) to authenticated;
grant execute on function public.set_primary_program_domain(uuid, uuid) to authenticated;
grant execute on function public.set_program_member_status(uuid, uuid, public.program_membership_status) to authenticated;
grant execute on function public.create_tenant_import_batch(uuid, uuid, text, jsonb) to authenticated;

create trigger tenant_import_batches_updated_at
  before update on public.tenant_import_batches
  for each row execute function public.handle_updated_at();
