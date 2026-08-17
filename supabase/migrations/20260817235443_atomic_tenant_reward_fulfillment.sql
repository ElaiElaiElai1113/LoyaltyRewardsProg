-- Fulfill a reward redemption and persist its tenant audit record in one
-- transaction. The prior client-side PATCH followed by INSERT could leave a
-- redemption fulfilled without its audit log when the second request failed.

create or replace function public.fulfill_redemption(
  p_redemption_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor public.profiles%rowtype;
  v_target record;
  v_redemption public.redemptions%rowtype;
  v_admin_log_id uuid;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_redemption_id is null then
    raise exception 'Redemption is required.';
  end if;

  select actor_profile.*
    into v_actor
  from public.profiles actor_profile
  where actor_profile.id = v_actor_id;

  if not found then
    raise exception 'Permission denied';
  end if;

  -- The program and business are derived from the stored redemption and its
  -- reward. The joined equality checks prevent a mismatched legacy row from
  -- being fulfilled, while the row lock serializes concurrent button presses.
  select
    redemption_row.id as redemption_id,
    redemption_row.program_id,
    redemption_row.profile_id,
    redemption_row.reward_id,
    redemption_row.reward_title,
    redemption_row.status,
    reward_row.business_id,
    business_row.active as business_active,
    program_row.status as program_status
    into v_target
  from public.redemptions redemption_row
  join public.rewards reward_row
    on reward_row.id = redemption_row.reward_id
   and reward_row.program_id = redemption_row.program_id
  join public.businesses business_row
    on business_row.id = reward_row.business_id
   and business_row.program_id = redemption_row.program_id
  join public.programs program_row
    on program_row.id = redemption_row.program_id
  where redemption_row.id = p_redemption_id
  for update of redemption_row;

  if not found then
    raise exception 'Redemption not found.';
  end if;

  -- Platform administrators may operate across tenants. Business users must
  -- have an active owner/staff membership for this exact program and business,
  -- and their current profile assignment must agree with that membership.
  if v_actor.role::text <> 'platform-admin' then
    if private.has_required_agreements(v_actor_id) is not true
      or v_target.program_status::text <> 'active'
      or v_target.business_active is not true
      or not exists (
        select 1
        from public.program_memberships membership
        where membership.program_id = v_target.program_id
          and membership.business_id = v_target.business_id
          and membership.profile_id = v_actor_id
          and membership.role in ('business-owner', 'business-staff')
          and membership.status = 'active'
          and membership.role::text = v_actor.role::text
          and v_actor.business_id = v_target.business_id
      )
    then
      raise exception 'Permission denied';
    end if;
  end if;

  -- A retry after a committed response is a safe no-op. Only a ready row is
  -- ever updated and a duplicate audit record is not created.
  if v_target.status = 'fulfilled' then
    select redemption_row.*
      into v_redemption
    from public.redemptions redemption_row
    where redemption_row.id = v_target.redemption_id
      and redemption_row.program_id = v_target.program_id
      and redemption_row.reward_id = v_target.reward_id;

    return pg_catalog.jsonb_build_object(
      'redemption', pg_catalog.to_jsonb(v_redemption),
      'program_id', v_target.program_id,
      'business_id', v_target.business_id,
      'admin_log_id', null,
      'already_fulfilled', true
    );
  end if;

  update public.redemptions redemption_row
  set status = 'fulfilled'
  where redemption_row.id = v_target.redemption_id
    and redemption_row.program_id = v_target.program_id
    and redemption_row.reward_id = v_target.reward_id
    and redemption_row.status = 'ready'
  returning redemption_row.*
    into v_redemption;

  if not found then
    raise exception 'Redemption could not be fulfilled.';
  end if;

  insert into public.admin_logs (
    program_id,
    actor_id,
    actor_name,
    action,
    details
  ) values (
    v_target.program_id,
    v_actor_id,
    coalesce(
      nullif(pg_catalog.btrim(v_actor.full_name), ''),
      case when v_actor.role::text = 'platform-admin' then 'Platform administrator' else 'Business staff' end
    ),
    'Redemption fulfilled',
    pg_catalog.format(
      'Marked reward "%s" as fulfilled for member ID: %s. Redemption ID: %s.',
      v_target.reward_title,
      v_target.profile_id,
      v_target.redemption_id
    )
  )
  returning id into v_admin_log_id;

  return pg_catalog.jsonb_build_object(
    'redemption', pg_catalog.to_jsonb(v_redemption),
    'program_id', v_target.program_id,
    'business_id', v_target.business_id,
    'admin_log_id', v_admin_log_id,
    'already_fulfilled', false
  );
end;
$$;

revoke all on function public.fulfill_redemption(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.fulfill_redemption(uuid)
  to authenticated;

notify pgrst, 'reload schema';
