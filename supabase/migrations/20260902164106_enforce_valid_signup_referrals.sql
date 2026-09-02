-- Reject invalid referral codes before Supabase Auth commits a new user. The
-- function intentionally returns only a boolean. It is callable only by the
-- server-side service role and the protected signup trigger.
create or replace function public.validate_signup_referral(
  p_referral_code text,
  p_program_id uuid,
  p_business_id uuid default null,
  p_kind text default 'member'
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_code text := pg_catalog.upper(pg_catalog.btrim(pg_catalog.coalesce(p_referral_code, '')));
  v_referrer_id uuid;
begin
  if v_code = '' or pg_catalog.length(v_code) > 120 or p_program_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.programs program
    where program.id = p_program_id
      and program.status::text in ('draft', 'active')
  ) then
    return false;
  end if;

  if p_kind = 'partner' then
    if p_business_id is null then
      return false;
    end if;

    return exists (
      select 1
      from public.partner_referrers referrer
      join public.businesses business
        on business.id = referrer.business_id
       and business.program_id = referrer.program_id
       and business.active = true
      where referrer.code = v_code
        and referrer.program_id = p_program_id
        and referrer.business_id = p_business_id
        and referrer.active = true
    );
  end if;

  if p_kind <> 'member' then
    return false;
  end if;

  select profile.id
    into v_referrer_id
  from public.profiles profile
  where profile.referral_code = v_code
  limit 1;

  if v_referrer_id is null
    and p_referral_code ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    select profile.id
      into v_referrer_id
    from public.profiles profile
    where profile.id = p_referral_code::uuid
    limit 1;
  end if;

  if v_referrer_id is null then
    return false;
  end if;

  if p_business_id is not null then
    return exists (
      select 1
      from public.businesses business
      join public.program_memberships membership
        on membership.program_id = business.program_id
       and membership.profile_id = v_referrer_id
       and membership.status::text = 'active'
      where business.id = p_business_id
        and business.program_id = p_program_id
        and business.active = true
        and (
          membership.role::text in ('member', 'program-admin')
          or (
            membership.role::text in ('business-owner', 'business-staff')
            and membership.business_id = business.id
          )
        )
    );
  end if;

  -- Without an explicit business, create_referral can only infer a target for
  -- an active owner or staff member. Keep this preflight rule identical.
  return exists (
    select 1
    from public.program_memberships membership
    join public.businesses business
      on business.id = membership.business_id
     and business.program_id = membership.program_id
     and business.active = true
    where membership.program_id = p_program_id
      and membership.profile_id = v_referrer_id
      and membership.role::text in ('business-owner', 'business-staff')
      and membership.status::text = 'active'
  );
end;
$$;

revoke all on function public.validate_signup_referral(text, uuid, uuid, text)
  from public, anon, authenticated, service_role;
grant execute on function public.validate_signup_referral(text, uuid, uuid, text)
  to service_role;

create or replace function private.enforce_valid_signup_referral()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_program_id_text text := pg_catalog.btrim(pg_catalog.coalesce(new.raw_user_meta_data ->> 'active_program_id', ''));
  v_referral_code text := pg_catalog.btrim(pg_catalog.coalesce(new.raw_user_meta_data ->> 'referral_code', ''));
  v_referral_business_id_text text := pg_catalog.btrim(pg_catalog.coalesce(new.raw_user_meta_data ->> 'referral_business_id', ''));
  v_partner_code text := pg_catalog.btrim(pg_catalog.coalesce(new.raw_user_meta_data ->> 'partner_referral_code', ''));
  v_partner_business_id_text text := pg_catalog.btrim(pg_catalog.coalesce(new.raw_user_meta_data ->> 'partner_business_id', ''));
  v_program_id uuid;
  v_business_id uuid;
begin
  if v_referral_code = '' and v_partner_code = '' then
    return new;
  end if;

  if v_referral_code <> '' and v_partner_code <> '' then
    raise exception using
      errcode = 'P0001',
      message = 'invalid_referral_code';
  end if;

  if v_program_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception using
      errcode = 'P0001',
      message = 'invalid_referral_code';
  end if;
  v_program_id := v_program_id_text::uuid;

  if v_referral_code <> '' then
    if v_referral_business_id_text <> '' then
      if v_referral_business_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
        raise exception using errcode = 'P0001', message = 'invalid_referral_code';
      end if;
      v_business_id := v_referral_business_id_text::uuid;
    else
      v_business_id := null;
    end if;

    if not public.validate_signup_referral(v_referral_code, v_program_id, v_business_id, 'member') then
      raise exception using errcode = 'P0001', message = 'invalid_referral_code';
    end if;
  else
    if v_partner_business_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception using errcode = 'P0001', message = 'invalid_referral_code';
    end if;
    v_business_id := v_partner_business_id_text::uuid;

    if not public.validate_signup_referral(v_partner_code, v_program_id, v_business_id, 'partner') then
      raise exception using errcode = 'P0001', message = 'invalid_referral_code';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_valid_signup_referral()
  from public, anon, authenticated;

drop trigger if exists enforce_valid_signup_referral on auth.users;
create trigger enforce_valid_signup_referral
  before insert on auth.users
  for each row execute function private.enforce_valid_signup_referral();

notify pgrst, 'reload schema';
