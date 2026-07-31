-- Close the remaining cross-tenant and public-flow release risks.
-- Public email delivery is bound to a verified hostname and an existing lead,
-- QR and gift-card lookups stay inside the active tenant, and all legacy
-- referral/credit mutations now carry an explicit program_id.

-- Referrals predate the multi-program model. Add durable tenant ownership and
-- replace the former global one-referral-per-profile constraint.
alter table public.referrals
  add column if not exists program_id uuid references public.programs(id) on delete restrict;

update public.referrals r
set program_id = b.program_id
from public.businesses b
where r.program_id is null
  and r.business_id = b.id;

update public.referrals r
set program_id = coalesce(
  (
    select pm.program_id
    from public.program_memberships pm
    where pm.profile_id = r.referee_id
      and pm.role = 'member'
      and pm.status = 'active'
    order by pm.created_at, pm.program_id
    limit 1
  ),
  '10000000-0000-4000-8000-000000000001'::uuid
)
where r.program_id is null;

alter table public.referrals alter column program_id set not null;
alter table public.referrals drop constraint if exists one_referral_per_referee;
create unique index if not exists referrals_program_referee_key
  on public.referrals (program_id, referee_id);
create index if not exists idx_referrals_program_business
  on public.referrals (program_id, business_id, created_at desc);

-- Durable authorization ledger for the public welcome-email endpoint. The
-- endpoint may authorize at most one send per ten minutes and three per day for
-- the same tenant lead, even when serverless instances are restarted.
create table if not exists public.welcome_email_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  lead_id uuid not null references public.early_access_leads(id) on delete cascade,
  recipient_email text not null,
  created_at timestamptz not null default now(),
  check (recipient_email = lower(trim(recipient_email)))
);

create index if not exists idx_welcome_email_attempts_lead_created
  on public.welcome_email_delivery_attempts (program_id, lead_id, created_at desc);

alter table public.welcome_email_delivery_attempts enable row level security;
revoke all on public.welcome_email_delivery_attempts from public, anon, authenticated;

create or replace function public.authorize_early_access_welcome_email(
  p_hostname text,
  p_email text
)
returns table (
  name text,
  support_email text,
  primary_color text,
  accent_color text,
  email_from_name text,
  email_from_address text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hostname text := lower(trim(coalesce(p_hostname, '')));
  v_email text := lower(trim(coalesce(p_email, '')));
  v_program public.programs%rowtype;
  v_settings public.program_settings%rowtype;
  v_lead public.early_access_leads%rowtype;
begin
  if v_hostname !~ '^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$' then
    raise exception 'verified_tenant_hostname_required';
  end if;

  if v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'valid_email_required';
  end if;

  select p.* into v_program
  from public.programs p
  join public.program_domains d on d.program_id = p.id
  where d.hostname = v_hostname
    and d.verification_status = 'verified'
    and p.status = 'active'
  limit 1;

  if not found then
    raise exception 'verified_tenant_hostname_required';
  end if;

  select * into v_settings
  from public.program_settings ps
  where ps.program_id = v_program.id;

  if not found
    or nullif(trim(v_settings.email_from_address), '') is null
    or v_settings.email_from_address !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
  then
    raise exception 'tenant_email_brand_unavailable';
  end if;

  select * into v_lead
  from public.early_access_leads eal
  where eal.program_id = v_program.id
    and lower(eal.email) = v_email
    and eal.marketing_consent_at is not null
    and eal.status <> 'archived'
  order by eal.created_at desc
  limit 1;

  if not found then
    raise exception 'welcome_email_lead_not_found';
  end if;

  -- Serialize attempts for this exact tenant/email pair so concurrent requests
  -- cannot race through the rate-limit counts.
  perform pg_advisory_xact_lock(hashtext(v_program.id::text), hashtext(v_email));

  if exists (
    select 1
    from public.welcome_email_delivery_attempts a
    where a.program_id = v_program.id
      and a.lead_id = v_lead.id
      and a.created_at >= now() - interval '10 minutes'
  ) or (
    select count(*)
    from public.welcome_email_delivery_attempts a
    where a.program_id = v_program.id
      and a.lead_id = v_lead.id
      and a.created_at >= now() - interval '24 hours'
  ) >= 3 then
    raise exception 'welcome_email_rate_limited';
  end if;

  insert into public.welcome_email_delivery_attempts (
    program_id,
    lead_id,
    recipient_email
  ) values (
    v_program.id,
    v_lead.id,
    v_email
  );

  return query
  select
    v_program.name,
    v_program.support_email,
    v_program.primary_color,
    v_program.accent_color,
    coalesce(nullif(trim(v_settings.email_from_name), ''), v_program.name),
    v_settings.email_from_address;
end;
$$;

revoke all on function public.authorize_early_access_welcome_email(text, text) from public;
grant execute on function public.authorize_early_access_welcome_email(text, text) to anon, authenticated;

-- QR lookup is a staff capability, not a global member directory. A staff
-- member can resolve only an active member in the exact program operated by
-- their active business membership.
create or replace function public.get_member_by_qr_token(p_token text)
returns table (
  id uuid,
  full_name text,
  email text,
  verification_status text,
  member_qr_token text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.profiles%rowtype;
  v_business public.businesses%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select * into v_actor
  from public.profiles p
  where p.id = auth.uid();

  if not found then
    raise exception 'Permission denied';
  end if;

  if v_actor.role::text = 'platform-admin' then
    return query
    select p.id, p.full_name, p.email, p.verification_status::text, p.member_qr_token
    from public.profiles p
    where p.member_qr_token = trim(p_token)
      and p.role::text = 'customer'
      and exists (
        select 1
        from public.program_memberships pm
        where pm.profile_id = p.id
          and pm.role = 'member'
          and pm.status = 'active'
      )
    limit 1;
    return;
  end if;

  if v_actor.role::text not in ('business-owner', 'business-staff')
    or v_actor.business_id is null
  then
    raise exception 'Permission denied';
  end if;

  select * into v_business
  from public.businesses b
  where b.id = v_actor.business_id
    and b.active = true;

  if not found or not public.has_active_business_program_access(
    v_business.id,
    array['business-owner', 'business-staff']::public.program_role[]
  ) then
    raise exception 'Permission denied';
  end if;

  return query
  select p.id, p.full_name, p.email, p.verification_status::text, p.member_qr_token
  from public.profiles p
  join public.program_memberships pm
    on pm.profile_id = p.id
   and pm.program_id = v_business.program_id
   and pm.role = 'member'
   and pm.status = 'active'
  where p.member_qr_token = trim(p_token)
    and p.role::text = 'customer'
  limit 1;
end;
$$;

revoke all on function public.get_member_by_qr_token(text) from public;
grant execute on function public.get_member_by_qr_token(text) to authenticated;

-- Remove the enumerable one-argument gift-card lookup. The replacement binds
-- every result to the current program. Anonymous users must possess the full
-- 128-bit public token; short codes work only for the owning customer or an
-- authorized team member of the issuing business.
revoke all on function public.get_public_gift_card_by_token(text) from public, anon, authenticated;

create or replace function public.get_public_gift_card_by_token(
  p_token text,
  p_program_id uuid
)
returns table (
  id uuid,
  catalog_id uuid,
  business_id uuid,
  customer_id uuid,
  code text,
  public_token text,
  status public.gift_card_status,
  points_spent integer,
  initial_balance numeric,
  remaining_balance numeric,
  expires_at timestamptz,
  redeemed_at timestamptz,
  business_name text,
  business_logo_url text,
  business_primary_color text,
  business_accent_color text,
  customer_first_name text,
  title text,
  description text,
  value_label text,
  image_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    gc.id,
    gc.catalog_id,
    gc.business_id,
    gc.customer_id,
    gc.code,
    gc.public_token,
    case
      when gc.status in ('redeemed', 'cancelled') then gc.status
      when gc.expires_at <= now() then 'expired'::public.gift_card_status
      when coalesce(gc.remaining_balance, public.gift_card_face_value_from_label(gcc.value_label), 0) <= 0
        then 'redeemed'::public.gift_card_status
      else gc.status
    end,
    gc.points_spent,
    coalesce(gc.initial_balance, public.gift_card_face_value_from_label(gcc.value_label), 0),
    coalesce(gc.remaining_balance, public.gift_card_face_value_from_label(gcc.value_label), 0),
    gc.expires_at,
    gc.redeemed_at,
    b.name,
    b.logo_url,
    pr.primary_color,
    pr.accent_color,
    split_part(coalesce(p.full_name, 'Member'), ' ', 1),
    coalesce(gcc.title, 'Gift card'),
    coalesce(gcc.description, ''),
    coalesce(gcc.value_label, ''),
    gcc.image_url
  from public.gift_cards gc
  join public.programs pr
    on pr.id = gc.program_id
   and pr.status = 'active'
  join public.businesses b
    on b.id = gc.business_id
   and b.program_id = gc.program_id
  join public.profiles p on p.id = gc.customer_id
  left join public.gift_card_catalog gcc
    on gcc.id = gc.catalog_id
   and gcc.program_id = gc.program_id
  where gc.program_id = p_program_id
    and (
      (
        p_token ~ '^[0-9a-f]{32}$'
        and gc.public_token = p_token
      )
      or (
        auth.uid() is not null
        and upper(gc.code) = upper(trim(p_token))
        and (
          gc.customer_id = auth.uid()
          or public.has_active_business_program_access(
            gc.business_id,
            array['business-owner', 'business-staff']::public.program_role[]
          )
        )
      )
    )
  limit 1;
$$;

revoke all on function public.get_public_gift_card_by_token(text, uuid) from public;
grant execute on function public.get_public_gift_card_by_token(text, uuid) to anon, authenticated;

-- Direct referral table mutations are replaced by tenant-aware security-definer
-- RPCs. Read policies preserve member self-service and exact business access.
drop policy if exists "Customers can view own referrals" on public.referrals;
drop policy if exists "Customers can create own referral" on public.referrals;
drop policy if exists "Business team can view own business referrals" on public.referrals;
drop policy if exists "Business team can update own business referrals" on public.referrals;
drop policy if exists "Platform admins can view referrals" on public.referrals;
drop policy if exists "Platform admins can update referrals" on public.referrals;

create policy "members read own program referrals"
  on public.referrals for select to authenticated
  using (
    auth.uid() in (referrer_id, referee_id)
    and public.is_program_member(program_id)
  );

create policy "business teams read exact program referrals"
  on public.referrals for select to authenticated
  using (
    public.has_active_business_program_access(
      business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
  );

create policy "platform admins read all referrals"
  on public.referrals for select to authenticated
  using (public.is_platform_admin());

revoke insert, update, delete on public.referrals from anon, authenticated;

drop policy if exists "staff can view referral participant profiles" on public.profiles;
create policy "authorized staff view exact referral participants"
  on public.profiles for select to authenticated
  using (
    public.is_platform_admin()
    or exists (
      select 1
      from public.referrals r
      where (r.referrer_id = profiles.id or r.referee_id = profiles.id)
        and public.has_active_business_program_access(
          r.business_id,
          array['business-owner', 'business-staff']::public.program_role[]
        )
    )
  );

create or replace function public.create_referral(
  referrer_code text,
  referee_id uuid,
  target_business_id uuid default null
)
returns table(status text, referral_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referrer_id uuid;
  v_business public.businesses%rowtype;
  v_inserted_id uuid;
begin
  if auth.uid() is null or auth.uid() <> create_referral.referee_id then
    raise exception 'Permission denied';
  end if;

  select p.id into v_referrer_id
  from public.profiles p
  where p.referral_code = upper(trim(create_referral.referrer_code))
  limit 1;

  if v_referrer_id is null
    and create_referral.referrer_code ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  then
    select p.id into v_referrer_id
    from public.profiles p
    where p.id = create_referral.referrer_code::uuid
    limit 1;
  end if;

  if v_referrer_id is null then
    status := 'missing-referrer';
    referral_id := null;
    return next;
    return;
  end if;

  if v_referrer_id = create_referral.referee_id then
    status := 'self-referral';
    referral_id := null;
    return next;
    return;
  end if;

  if create_referral.target_business_id is not null then
    select * into v_business
    from public.businesses b
    where b.id = create_referral.target_business_id
      and b.active = true;
  else
    select b.* into v_business
    from public.program_memberships pm
    join public.businesses b
      on b.id = pm.business_id
     and b.program_id = pm.program_id
     and b.active = true
    where pm.profile_id = v_referrer_id
      and pm.role in ('business-owner', 'business-staff')
      and pm.status = 'active'
    order by pm.created_at, b.id
    limit 1;
  end if;

  if v_business.id is null
    or not exists (
      select 1
      from public.program_memberships pm
      where pm.program_id = v_business.program_id
        and pm.profile_id = v_referrer_id
        and pm.status = 'active'
        and (
          pm.role in ('member', 'program-admin')
          or (
            pm.role in ('business-owner', 'business-staff')
            and pm.business_id = v_business.id
          )
        )
    )
  then
    status := 'cross-business';
    referral_id := null;
    return next;
    return;
  end if;

  if not exists (
    select 1
    from public.program_memberships pm
    where pm.program_id = v_business.program_id
      and pm.profile_id = create_referral.referee_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    status := 'cross-business';
    referral_id := null;
    return next;
    return;
  end if;

  insert into public.referrals (
    program_id,
    referrer_id,
    referee_id,
    business_id
  ) values (
    v_business.program_id,
    v_referrer_id,
    create_referral.referee_id,
    v_business.id
  )
  returning id into v_inserted_id;

  status := 'created';
  referral_id := v_inserted_id;
  return next;
exception
  when unique_violation then
    status := 'duplicate';
    referral_id := null;
    return next;
end;
$$;

revoke all on function public.create_referral(text, uuid, uuid) from public;
grant execute on function public.create_referral(text, uuid, uuid) to authenticated;

create or replace function public.get_staff_referrals(target_business_id uuid default null)
returns table (
  id uuid,
  referrer_id uuid,
  referee_id uuid,
  business_id uuid,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz,
  referrer_full_name text,
  referrer_email text,
  referee_full_name text,
  referee_email text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_actor public.profiles%rowtype;
  v_business_id uuid;
begin
  select * into v_actor from public.profiles p where p.id = auth.uid();
  if not found then raise exception 'Permission denied'; end if;

  if v_actor.role::text = 'platform-admin' then
    return query
    select
      r.id, r.referrer_id, r.referee_id, r.business_id, r.status,
      r.approved_by, r.approved_at, r.created_at,
      referrer.full_name, referrer.email, referee.full_name, referee.email
    from public.referrals r
    join public.profiles referrer on referrer.id = r.referrer_id
    join public.profiles referee on referee.id = r.referee_id
    where target_business_id is null or r.business_id = target_business_id;
    return;
  end if;

  v_business_id := coalesce(target_business_id, v_actor.business_id);
  if v_business_id is null or not public.has_active_business_program_access(
    v_business_id,
    array['business-owner', 'business-staff']::public.program_role[]
  ) then
    raise exception 'Permission denied';
  end if;

  return query
  select
    r.id, r.referrer_id, r.referee_id, r.business_id, r.status,
    r.approved_by, r.approved_at, r.created_at,
    referrer.full_name, referrer.email, referee.full_name, referee.email
  from public.referrals r
  join public.businesses b
    on b.id = r.business_id
   and b.program_id = r.program_id
  join public.profiles referrer on referrer.id = r.referrer_id
  join public.profiles referee on referee.id = r.referee_id
  where r.business_id = v_business_id;
end;
$$;

revoke all on function public.get_staff_referrals(uuid) from public;
grant execute on function public.get_staff_referrals(uuid) to authenticated;

create or replace function public.approve_referral(
  referral_id uuid,
  approver_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referral public.referrals%rowtype;
  v_actor public.profiles%rowtype;
begin
  if auth.uid() is null or approve_referral.approver_id <> auth.uid() then
    raise exception 'Approver must match current user.';
  end if;

  select * into v_actor from public.profiles p where p.id = auth.uid();
  if not found then raise exception 'Permission denied'; end if;

  select * into v_referral
  from public.referrals r
  where r.id = approve_referral.referral_id
    and r.status = 'pending'
  for update;

  if not found then
    raise exception 'Referral is not pending or could not be approved.';
  end if;

  if not public.has_active_business_program_access(
    v_referral.business_id,
    array['business-owner', 'business-staff']::public.program_role[]
  ) then
    raise exception 'Permission denied';
  end if;

  if not exists (
    select 1 from public.businesses b
    where b.id = v_referral.business_id
      and b.program_id = v_referral.program_id
      and b.active = true
  ) or not exists (
    select 1 from public.program_memberships pm
    where pm.program_id = v_referral.program_id
      and pm.profile_id = v_referral.referee_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'Referral participants are not active in this rewards program.';
  end if;

  insert into public.reward_balances (program_id, profile_id)
  select v_referral.program_id, participant_id
  from (values (v_referral.referrer_id), (v_referral.referee_id)) participants(participant_id)
  on conflict (program_id, profile_id) do nothing;

  update public.referrals
  set status = 'approved', approved_by = auth.uid(), approved_at = now()
  where id = v_referral.id
    and program_id = v_referral.program_id;

  update public.reward_balances rb
  set available_credits = rb.available_credits + 1,
      updated_at = now()
  where rb.program_id = v_referral.program_id
    and rb.profile_id in (v_referral.referrer_id, v_referral.referee_id);

  if (
    select count(*) from public.reward_balances rb
    where rb.program_id = v_referral.program_id
      and rb.profile_id in (v_referral.referrer_id, v_referral.referee_id)
  ) <> 2 then
    raise exception 'Balance not found.';
  end if;

  insert into public.activities (
    program_id, profile_id, business_id, type, title, points, status
  ) values
    (v_referral.program_id, v_referral.referrer_id, v_referral.business_id, 'bonus', 'Referral credit awarded', 0, 'posted'),
    (v_referral.program_id, v_referral.referee_id, v_referral.business_id, 'bonus', 'Referral credit awarded', 0, 'posted');

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  values (
    v_referral.program_id,
    auth.uid(),
    coalesce(v_actor.full_name, 'Business staff'),
    'Referral approved',
    format('Approved referral %s for business %s.', v_referral.id, v_referral.business_id)
  );
end;
$$;

revoke all on function public.approve_referral(uuid, uuid) from public;
grant execute on function public.approve_referral(uuid, uuid) to authenticated;

create or replace function public.reject_referral(referral_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_referral public.referrals%rowtype;
begin
  select * into v_referral
  from public.referrals r
  where r.id = reject_referral.referral_id
    and r.status = 'pending'
  for update;

  if not found then
    raise exception 'Referral is not pending or could not be rejected.';
  end if;

  if not public.has_active_business_program_access(
    v_referral.business_id,
    array['business-owner', 'business-staff']::public.program_role[]
  ) then
    raise exception 'Permission denied';
  end if;

  update public.referrals
  set status = 'rejected'
  where id = v_referral.id
    and program_id = v_referral.program_id;
end;
$$;

revoke all on function public.reject_referral(uuid) from public;
grant execute on function public.reject_referral(uuid) to authenticated;

-- Credit codes now inherit the active tenant explicitly on creation and can be
-- resolved only by an active team member of a business in that same tenant.
drop index if exists public.credit_redemptions_profile_code_pending_key;
drop index if exists public.credit_redemptions_code_pending_key;
create unique index if not exists credit_redemptions_program_profile_pending_key
  on public.credit_redemptions (program_id, profile_id)
  where status = 'pending';
create unique index if not exists credit_redemptions_program_code_pending_key
  on public.credit_redemptions (program_id, code)
  where status = 'pending';

drop policy if exists "Users can view own credit redemptions" on public.credit_redemptions;
drop policy if exists "Users can create own credit redemptions" on public.credit_redemptions;
drop policy if exists "Users can expire own pending credit redemptions" on public.credit_redemptions;
drop policy if exists "Business owners can view credit redemptions" on public.credit_redemptions;
drop policy if exists "Business owners can update credit redemption status" on public.credit_redemptions;

create policy "members read own program credit codes"
  on public.credit_redemptions for select to authenticated
  using (
    auth.uid() = profile_id
    and public.is_program_member(program_id, array['member']::public.program_role[])
  );

create policy "members create own program credit codes"
  on public.credit_redemptions for insert to authenticated
  with check (
    auth.uid() = profile_id
    and public.is_program_member(program_id, array['member']::public.program_role[])
  );

create policy "members expire own pending program credit codes"
  on public.credit_redemptions for update to authenticated
  using (
    auth.uid() = profile_id
    and status = 'pending'
    and public.is_program_member(program_id, array['member']::public.program_role[])
  )
  with check (
    auth.uid() = profile_id
    and status = 'expired'
    and public.is_program_member(program_id, array['member']::public.program_role[])
  );

create or replace function public.redeem_credit_code(
  code text,
  business_id uuid
)
returns table(profile_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_redemption public.credit_redemptions%rowtype;
  v_actor public.profiles%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  select * into v_actor from public.profiles p where p.id = auth.uid();
  select * into v_business
  from public.businesses b
  where b.id = redeem_credit_code.business_id
    and b.active = true;

  if not found or not public.has_active_business_program_access(
    redeem_credit_code.business_id,
    array['business-owner', 'business-staff']::public.program_role[]
  ) then
    raise exception 'Permission denied';
  end if;

  select * into v_redemption
  from public.credit_redemptions cr
  where cr.program_id = v_business.program_id
    and cr.code = regexp_replace(redeem_credit_code.code, '\D', '', 'g')
    and cr.status = 'pending'
    and cr.expires_at > now()
  order by cr.created_at desc
  limit 1
  for update;

  if not found then raise exception 'Invalid or expired code'; end if;

  if not exists (
    select 1 from public.program_memberships pm
    where pm.program_id = v_business.program_id
      and pm.profile_id = v_redemption.profile_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'Member is not active in this rewards program.';
  end if;

  update public.reward_balances rb
  set available_credits = rb.available_credits - 1,
      updated_at = now()
  where rb.program_id = v_business.program_id
    and rb.profile_id = v_redemption.profile_id
    and rb.available_credits > 0;

  if not found then
    raise exception 'No reward credits are available for this member.';
  end if;

  update public.credit_redemptions
  set status = 'used', used_at = now(), used_by_business_id = v_business.id
  where id = v_redemption.id
    and program_id = v_business.program_id;

  insert into public.activities (
    program_id, profile_id, business_id, type, title, points, status
  ) values (
    v_business.program_id,
    v_redemption.profile_id,
    v_business.id,
    'adjustment',
    'Reward credit used',
    0,
    'posted'
  );

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  values (
    v_business.program_id,
    auth.uid(),
    coalesce(v_actor.full_name, 'Staff redemption'),
    'Reward credit used',
    format('Used 1 reward credit for member %s.', v_redemption.profile_id)
  );

  profile_id := v_redemption.profile_id;
  return next;
end;
$$;

revoke all on function public.redeem_credit_code(text, uuid) from public;
grant execute on function public.redeem_credit_code(text, uuid) to authenticated;

revoke all on function public.consume_reward_credit(uuid) from public, anon, authenticated;

create or replace function public.consume_reward_credit(
  p_profile_id uuid,
  p_program_id uuid
)
returns public.reward_balances
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.profiles%rowtype;
  v_actor_business_id uuid;
  v_balance public.reward_balances%rowtype;
  v_updated public.reward_balances%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_actor from public.profiles p where p.id = auth.uid();
  if not found then raise exception 'Permission denied'; end if;

  if not public.is_platform_admin()
    and not public.is_program_member(
      p_program_id,
      array['program-admin']::public.program_role[]
    )
  then
    select pm.business_id into v_actor_business_id
    from public.program_memberships pm
    where pm.program_id = p_program_id
      and pm.profile_id = auth.uid()
      and pm.role in ('business-owner', 'business-staff')
      and pm.status = 'active'
      and public.has_active_business_program_access(
        pm.business_id,
        array['business-owner', 'business-staff']::public.program_role[]
      )
    order by pm.created_at
    limit 1;

    if v_actor_business_id is null then raise exception 'Permission denied'; end if;
  end if;

  if not exists (
    select 1 from public.program_memberships pm
    where pm.program_id = p_program_id
      and pm.profile_id = p_profile_id
      and pm.role = 'member'
      and pm.status = 'active'
  ) then
    raise exception 'Member is not active in this rewards program.';
  end if;

  select * into v_balance
  from public.reward_balances rb
  where rb.program_id = p_program_id
    and rb.profile_id = p_profile_id
  for update;

  if not found or v_balance.available_credits <= 0 then
    raise exception 'No Reward Credits are available for this member.';
  end if;

  update public.reward_balances rb
  set available_credits = rb.available_credits - 1,
      updated_at = now()
  where rb.program_id = p_program_id
    and rb.profile_id = p_profile_id
  returning * into v_updated;

  insert into public.activities (
    program_id, profile_id, business_id, type, title, description, points, status
  ) values (
    p_program_id,
    p_profile_id,
    v_actor_business_id,
    'adjustment',
    'Reward Credit used',
    '',
    0,
    'posted'
  );

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  values (
    p_program_id,
    auth.uid(),
    coalesce(v_actor.full_name, 'Staff'),
    'Reward Credit used',
    format('Used 1 Reward Credit for member %s.', p_profile_id)
  );

  return v_updated;
end;
$$;

revoke all on function public.consume_reward_credit(uuid, uuid) from public;
grant execute on function public.consume_reward_credit(uuid, uuid) to authenticated;

-- Partner attribution must agree on the program across the actor, source
-- business, referrer, existing attribution, and inserted row.
drop policy if exists "Staff can view own business partner referrers" on public.partner_referrers;
drop policy if exists "Staff can manage own business partner referrers" on public.partner_referrers;
drop policy if exists "Staff can update own business partner referrers" on public.partner_referrers;
drop policy if exists "Staff can view own business partner referrals" on public.partner_referrals;
drop policy if exists "Customers can view own partner referrals" on public.partner_referrals;
drop policy if exists "Staff can view own business partner credit ledger" on public.partner_credit_ledger;
drop policy if exists "Staff can update own business partner credit ledger" on public.partner_credit_ledger;

create policy "business teams read exact partner referrers"
  on public.partner_referrers for select to authenticated
  using (
    public.has_active_business_program_access(
      business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
  );

create policy "business teams create exact partner referrers"
  on public.partner_referrers for insert to authenticated
  with check (
    public.has_active_business_program_access(
      business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
    and exists (
      select 1 from public.businesses b
      where b.id = partner_referrers.business_id
        and b.program_id = partner_referrers.program_id
        and b.active = true
    )
  );

create policy "business teams update exact partner referrers"
  on public.partner_referrers for update to authenticated
  using (
    public.has_active_business_program_access(
      business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
  )
  with check (
    public.has_active_business_program_access(
      business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
    and exists (
      select 1 from public.businesses b
      where b.id = partner_referrers.business_id
        and b.program_id = partner_referrers.program_id
        and b.active = true
    )
  );

create policy "business teams read exact partner referrals"
  on public.partner_referrals for select to authenticated
  using (
    public.has_active_business_program_access(
      source_business_id,
      array['business-owner', 'business-staff']::public.program_role[]
    )
  );

create policy "members read own program partner referrals"
  on public.partner_referrals for select to authenticated
  using (
    auth.uid() = customer_profile_id
    and public.is_program_member(program_id, array['member']::public.program_role[])
  );

create policy "business teams read exact partner credit ledger"
  on public.partner_credit_ledger for select to authenticated
  using (
    exists (
      select 1
      from public.partner_referrers pr
      where pr.id = partner_credit_ledger.partner_referrer_id
        and pr.program_id = partner_credit_ledger.program_id
        and public.has_active_business_program_access(
          pr.business_id,
          array['business-owner', 'business-staff']::public.program_role[]
        )
    )
  );

create policy "business teams update exact partner credit ledger"
  on public.partner_credit_ledger for update to authenticated
  using (
    exists (
      select 1
      from public.partner_referrers pr
      where pr.id = partner_credit_ledger.partner_referrer_id
        and pr.program_id = partner_credit_ledger.program_id
        and public.has_active_business_program_access(
          pr.business_id,
          array['business-owner', 'business-staff']::public.program_role[]
        )
    )
  )
  with check (
    exists (
      select 1
      from public.partner_referrers pr
      where pr.id = partner_credit_ledger.partner_referrer_id
        and pr.program_id = partner_credit_ledger.program_id
        and public.has_active_business_program_access(
          pr.business_id,
          array['business-owner', 'business-staff']::public.program_role[]
        )
    )
  );

create or replace function public.attribute_partner_referral(
  p_partner_code text,
  p_customer_profile_id uuid,
  p_source_business_id uuid
)
returns public.partner_referrals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business public.businesses%rowtype;
  v_referrer public.partner_referrers%rowtype;
  v_existing public.partner_referrals%rowtype;
  v_inserted public.partner_referrals%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_customer_profile_id is null or p_source_business_id is null then
    raise exception 'Customer and business are required.';
  end if;

  select * into v_business
  from public.businesses b
  where b.id = p_source_business_id
    and b.active = true;
  if not found then raise exception 'Business not found.'; end if;

  if auth.uid() = p_customer_profile_id then
    if not exists (
      select 1 from public.program_memberships pm
      where pm.program_id = v_business.program_id
        and pm.profile_id = p_customer_profile_id
        and pm.role = 'member'
        and pm.status = 'active'
    ) then
      raise exception 'Customer is not active in this rewards program.';
    end if;
  elsif not public.has_active_business_program_access(
    p_source_business_id,
    array['business-owner', 'business-staff']::public.program_role[]
  ) then
    raise exception 'Permission denied';
  end if;

  select * into v_referrer
  from public.partner_referrers pr
  where pr.program_id = v_business.program_id
    and pr.business_id = p_source_business_id
    and pr.code = upper(trim(p_partner_code))
    and pr.active = true
  limit 1;

  if not found then raise exception 'Partner code not found.'; end if;

  select * into v_existing
  from public.partner_referrals pr
  where pr.program_id = v_business.program_id
    and pr.customer_profile_id = p_customer_profile_id
    and pr.source_business_id = p_source_business_id
    and pr.status in ('attributed', 'credited')
  limit 1;

  if found then return v_existing; end if;

  insert into public.partner_referrals (
    program_id,
    partner_referrer_id,
    customer_profile_id,
    source_business_id,
    status
  ) values (
    v_business.program_id,
    v_referrer.id,
    p_customer_profile_id,
    p_source_business_id,
    'attributed'
  )
  returning * into v_inserted;

  return v_inserted;
end;
$$;

revoke all on function public.attribute_partner_referral(text, uuid, uuid) from public;
grant execute on function public.attribute_partner_referral(text, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
