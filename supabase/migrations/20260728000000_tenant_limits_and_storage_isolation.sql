-- Approval-gated: enforce plan limits and isolate verification documents by
-- program. Apply only after a verified backup and reconciliation report.

create or replace function public.get_program_entitlements_internal(p_program_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sp.entitlements, '{}'::jsonb)
  from public.program_subscriptions ps
  join public.subscription_plans sp on sp.id = ps.plan_id
  where ps.program_id = p_program_id
  limit 1;
$$;

revoke all on function public.get_program_entitlements_internal(uuid) from public;

create or replace function public.enforce_program_resource_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
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

drop trigger if exists enforce_custom_domain_limit on public.program_domains;
create trigger enforce_custom_domain_limit
  before insert or update on public.program_domains
  for each row execute function public.enforce_program_resource_limit('customDomains');

drop trigger if exists enforce_business_limit on public.businesses;
create trigger enforce_business_limit
  before insert or update on public.businesses
  for each row execute function public.enforce_program_resource_limit('businesses');

drop trigger if exists enforce_member_limit on public.program_memberships;
create trigger enforce_member_limit
  before insert or update on public.program_memberships
  for each row execute function public.enforce_program_resource_limit('members');

drop policy if exists "Members can upload own verification IDs" on storage.objects;
drop policy if exists "Onboarding can upload pending verification IDs" on storage.objects;
drop policy if exists "Members can view own verification IDs" on storage.objects;
drop policy if exists "Platform admins can view member verification IDs" on storage.objects;
drop policy if exists "Program admins can view member verification IDs" on storage.objects;

create policy "Onboarding uploads program-scoped verification IDs"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'member-verification-ids'
    and (storage.foldername(name))[1] = 'pending'
    and exists (
      select 1 from public.programs p
      where p.id::text = (storage.foldername(name))[2]
        and p.status in ('draft', 'active')
    )
  );

create policy "Members view attached verification IDs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-verification-ids'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.verification_document_path = name
    )
  );

create policy "Program admins view tenant verification IDs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-verification-ids'
    and exists (
      select 1 from public.profiles p
      where p.verification_document_path = name
        and public.is_program_member(
          p.program_id,
          array['program-admin']::public.program_role[]
        )
    )
  );

create policy "Platform admins view all verification IDs"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'member-verification-ids'
    and public.is_platform_admin()
  );
