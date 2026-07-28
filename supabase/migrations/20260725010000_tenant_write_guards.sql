-- Defense in depth for legacy security-definer RPCs. RLS can be bypassed by a
-- function owner, but triggers still execute and verify the authenticated actor.

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
  if v_role = 'service_role' then
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

create or replace function public.enforce_business_program_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_business_program_id uuid;
begin
  v_business_id := nullif(to_jsonb(new) ->> tg_argv[0], '')::uuid;
  if v_business_id is null then return new; end if;

  select program_id into v_business_program_id
  from public.businesses
  where id = v_business_id;

  if v_business_program_id is null then
    raise exception 'business_not_found';
  end if;
  if new.program_id <> v_business_program_id then
    raise exception 'cross_program_business_reference';
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'businesses', 'reward_balances', 'rewards', 'products', 'orders',
    'order_line_items', 'promotions', 'activities', 'redemptions', 'admin_logs',
    'credit_redemptions', 'partner_referrers', 'partner_referrals',
    'partner_credit_ledger', 'gift_card_catalog', 'gift_cards', 'gift_card_events',
    'memberships', 'agreement_versions',
    'agreement_acceptances', 'member_transactions'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists enforce_tenant_write_access on public.%I', table_name);
      execute format(
        'create trigger enforce_tenant_write_access before insert or update or delete on public.%I for each row execute function public.enforce_tenant_write_access()',
        table_name
      );
    end if;
  end loop;
end $$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'rewards', 'products', 'orders', 'promotions', 'activities',
    'partner_referrers', 'gift_card_catalog', 'gift_cards', 'member_transactions'
  ]
  loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop trigger if exists enforce_business_program_match on public.%I', table_name);
      execute format(
        'create trigger enforce_business_program_match before insert or update on public.%I for each row execute function public.enforce_business_program_match(%L)',
        table_name, 'business_id'
      );
    end if;
  end loop;
end $$;

create or replace function public.get_plan_entitlements(p_program_id uuid)
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
    and public.is_program_member(p_program_id)
  limit 1;
$$;

create or replace function public.program_has_entitlement(
  p_program_id uuid,
  p_feature text
) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((public.get_plan_entitlements(p_program_id) -> 'features' ->> p_feature)::boolean, false);
$$;

grant execute on function public.get_plan_entitlements(uuid) to authenticated;
grant execute on function public.program_has_entitlement(uuid, text) to authenticated;

create or replace function public.invite_program_admin(p_program_id uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile_id uuid;
  v_membership_id uuid;
  v_limit integer;
  v_count integer;
begin
  if not public.is_program_member(p_program_id, array['program-admin']::public.program_role[]) then
    raise exception 'program_admin_required';
  end if;
  select id into v_profile_id from public.profiles where lower(email) = lower(trim(p_email));
  if v_profile_id is null then raise exception 'account_not_found'; end if;

  v_limit := coalesce((public.get_plan_entitlements(p_program_id) ->> 'administrators')::integer, 1);
  select count(*) into v_count from public.program_memberships
  where program_id = p_program_id and role = 'program-admin' and status in ('active', 'invited');
  if v_count >= v_limit then raise exception 'administrator_limit_reached'; end if;

  insert into public.program_memberships (program_id, profile_id, role, status)
  values (p_program_id, v_profile_id, 'program-admin', 'invited')
  on conflict (program_id, profile_id, role, (coalesce(business_id, '00000000-0000-0000-0000-000000000000'::uuid)))
  do update set status = 'invited', updated_at = now()
  returning id into v_membership_id;
  return v_membership_id;
end;
$$;

create or replace function public.accept_program_invitation(p_program_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.program_memberships
  set status = 'active', updated_at = now()
  where program_id = p_program_id and profile_id = auth.uid() and status = 'invited';
  if not found then raise exception 'invitation_not_found'; end if;
end;
$$;

create or replace function public.get_program_team(p_program_id uuid)
returns table (
  membership_id uuid,
  profile_id uuid,
  full_name text,
  email text,
  role public.program_role,
  status public.program_membership_status,
  business_id uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select pm.id, pm.profile_id, p.full_name, p.email, pm.role, pm.status, pm.business_id, pm.created_at
  from public.program_memberships pm
  join public.profiles p on p.id = pm.profile_id
  where pm.program_id = p_program_id
    and public.is_program_member(p_program_id, array['program-admin']::public.program_role[])
  order by pm.created_at;
$$;

grant execute on function public.invite_program_admin(uuid, text) to authenticated;
grant execute on function public.accept_program_invitation(uuid) to authenticated;
grant execute on function public.get_program_team(uuid) to authenticated;

create table public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

drop index if exists public.idx_early_access_leads_email_unique;
drop index if exists public.idx_early_access_leads_whatsapp_unique;
create unique index idx_early_access_leads_program_email_unique
  on public.early_access_leads (program_id, lower(email)) where email is not null;
create unique index idx_early_access_leads_program_whatsapp_unique
  on public.early_access_leads (program_id, whatsapp) where whatsapp is not null;

create or replace function public.create_program_early_access_lead(
  p_program_id uuid,
  p_full_name text,
  p_email text,
  p_whatsapp text,
  p_notes text,
  p_marketing_consent boolean default false,
  p_source text default 'early-access-page'
) returns public.early_access_leads
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead public.early_access_leads%rowtype;
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
  v_whatsapp text := nullif(trim(coalesce(p_whatsapp, '')), '');
begin
  if not exists (select 1 from public.programs where id = p_program_id and status = 'active') then
    raise exception 'program_not_available';
  end if;
  if v_email is null and v_whatsapp is null then raise exception 'contact_required'; end if;
  if v_email is not null and v_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
    raise exception 'valid_email_required';
  end if;
  if p_marketing_consent is not true then raise exception 'contact_consent_required'; end if;

  insert into public.early_access_leads (
    program_id, full_name, email, whatsapp, notes, source, marketing_consent_at
  ) values (
    p_program_id, nullif(trim(coalesce(p_full_name, '')), ''), v_email, v_whatsapp,
    trim(coalesce(p_notes, '')), coalesce(nullif(trim(p_source), ''), 'early-access-page'), now()
  )
  on conflict do nothing returning * into v_lead;

  if v_lead.id is null then
    select * into v_lead from public.early_access_leads
    where program_id = p_program_id
      and ((v_email is not null and lower(email) = v_email) or (v_whatsapp is not null and whatsapp = v_whatsapp))
    order by created_at desc limit 1;
  end if;
  return v_lead;
end;
$$;

revoke all on function public.create_program_early_access_lead(uuid, text, text, text, text, boolean, text) from public;
grant execute on function public.create_program_early_access_lead(uuid, text, text, text, text, boolean, text) to anon, authenticated;

create or replace function public.update_program_brand_settings(
  p_program_id uuid,
  p_name text,
  p_country_code text,
  p_locale text,
  p_currency text,
  p_timezone text,
  p_primary_color text,
  p_accent_color text,
  p_logo_url text,
  p_support_email text
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_program_member(p_program_id, array['program-admin']::public.program_role[]) then
    raise exception 'program_admin_required';
  end if;
  if trim(p_name) = '' then raise exception 'program_name_required'; end if;
  if upper(p_country_code) !~ '^[A-Z]{2}$' then raise exception 'invalid_country_code'; end if;
  if upper(p_currency) !~ '^[A-Z]{3}$' then raise exception 'invalid_currency'; end if;
  if p_primary_color !~ '^#[0-9a-fA-F]{6}$' or p_accent_color !~ '^#[0-9a-fA-F]{6}$' then
    raise exception 'invalid_brand_color';
  end if;
  update public.programs set
    name = trim(p_name),
    country_code = upper(p_country_code),
    locale = trim(p_locale),
    currency = upper(p_currency),
    timezone = trim(p_timezone),
    primary_color = lower(p_primary_color),
    accent_color = lower(p_accent_color),
    logo_url = nullif(trim(coalesce(p_logo_url, '')), ''),
    support_email = lower(trim(p_support_email)),
    updated_at = now()
  where id = p_program_id;
end;
$$;

grant execute on function public.update_program_brand_settings(uuid, text, text, text, text, text, text, text, text, text) to authenticated;
