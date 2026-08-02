-- Agreement gates and visibility were originally global. Once agreement rows
-- received program_id, that behavior made a new tenant's users inherit
-- Medellin requirements and hid their otherwise valid tenant data behind RLS.

create or replace function private.has_required_agreements(target_profile_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public, private
as $$
declare
  target_role public.user_role;
  target_business_id uuid;
  active_membership_count integer;
  missing_required_count integer;
begin
  if target_profile_id is null then
    return false;
  end if;

  select p.role, p.business_id
    into target_role, target_business_id
  from public.profiles p
  where p.id = target_profile_id;

  if target_role is null then
    return false;
  end if;
  if target_role = 'platform-admin' then
    return true;
  end if;

  select count(*)
    into active_membership_count
  from public.program_memberships pm
  where pm.profile_id = target_profile_id
    and pm.status = 'active';

  if active_membership_count = 0 then
    return false;
  end if;

  select count(*)
    into missing_required_count
  from public.agreement_versions av
  where av.is_active
    and av.required_role = target_role
    and exists (
      select 1
      from public.program_memberships pm
      where pm.profile_id = target_profile_id
        and pm.program_id = av.program_id
        and pm.status = 'active'
    )
    and (
      av.business_id is null
      or av.business_id = target_business_id
    )
    and not exists (
      select 1
      from public.agreement_acceptances aa
      where aa.profile_id = target_profile_id
        and aa.program_id = av.program_id
        and aa.agreement_version_id = av.id
        and aa.agreement_kind = av.kind
        and aa.agreement_version = av.version
        and aa.content_hash = av.content_hash
        and aa.accepted_electronic_records
        and aa.accepted_terms
        and aa.signature_svg is not null
        and length(aa.signature_svg) >= 80
    );

  return missing_required_count = 0;
end;
$$;

drop policy if exists "Users can view active agreement versions" on public.agreement_versions;
create policy "Users can view active agreement versions"
  on public.agreement_versions for select
  to authenticated
  using (
    public.is_platform_admin()
    or (
      is_active
      and public.is_program_member(program_id)
      and (
        business_id is null
        or exists (
          select 1
          from public.program_memberships pm
          where pm.profile_id = auth.uid()
            and pm.program_id = agreement_versions.program_id
            and pm.business_id = agreement_versions.business_id
            and pm.status = 'active'
            and pm.role in ('business-owner', 'business-staff')
        )
      )
    )
  );
