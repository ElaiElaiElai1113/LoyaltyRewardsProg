-- Approval-gated platform operations: status-aware domain resolution, usage,
-- and auditable lifecycle changes.

create or replace function public.resolve_program_host_state(p_hostname text)
returns table (
  id uuid,
  name text,
  slug text,
  status public.program_status,
  country_code text,
  locale text,
  currency text,
  timezone text,
  primary_color text,
  accent_color text,
  logo_url text,
  support_email text,
  map_latitude numeric,
  map_longitude numeric,
  feature_flags jsonb,
  domain_verification_status text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id, p.name, p.slug, p.status, p.country_code, p.locale, p.currency,
    p.timezone, p.primary_color, p.accent_color, p.logo_url, p.support_email,
    p.map_latitude, p.map_longitude, p.feature_flags, d.verification_status
  from public.programs p
  join public.program_domains d on d.program_id = p.id
  where d.hostname = lower(split_part(p_hostname, ':', 1))
  limit 1;
$$;

grant execute on function public.resolve_program_host_state(text) to anon, authenticated;

create or replace function public.get_platform_program_usage()
returns table (
  program_id uuid,
  administrators bigint,
  businesses bigint,
  members bigint,
  custom_domains bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    (select count(*) from public.program_memberships pm where pm.program_id = p.id and pm.role = 'program-admin' and pm.status in ('active', 'invited')),
    (select count(*) from public.businesses b where b.program_id = p.id),
    (select count(*) from public.program_memberships pm where pm.program_id = p.id and pm.role = 'member' and pm.status = 'active'),
    (select count(*) from public.program_domains d where d.program_id = p.id and d.hostname not like '%.rewardsplatform.app')
  from public.programs p
  where public.is_platform_admin();
$$;

revoke all on function public.get_platform_program_usage() from public;
grant execute on function public.get_platform_program_usage() to authenticated;

create or replace function public.enforce_program_feature()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
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

do $$
declare
  v_table text;
begin
  foreach v_table in array array['gift_card_catalog', 'gift_cards', 'gift_card_events']
  loop
    execute format('drop trigger if exists enforce_gift_cards_entitlement on public.%I', v_table);
    execute format(
      'create trigger enforce_gift_cards_entitlement before insert or update or delete on public.%I for each row execute function public.enforce_program_feature(%L)',
      v_table, 'giftCards'
    );
  end loop;
  foreach v_table in array array['partner_referrers', 'partner_referrals', 'partner_credit_ledger']
  loop
    execute format('drop trigger if exists enforce_referrals_entitlement on public.%I', v_table);
    execute format(
      'create trigger enforce_referrals_entitlement before insert or update or delete on public.%I for each row execute function public.enforce_program_feature(%L)',
      v_table, 'referrals'
    );
  end loop;
end $$;

create or replace function public.set_program_status(
  p_program_id uuid,
  p_status public.program_status,
  p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous public.program_status;
  v_actor_name text;
begin
  if not public.is_platform_admin() then raise exception 'platform_admin_required'; end if;
  select status into v_previous from public.programs where id = p_program_id for update;
  if v_previous is null then raise exception 'program_not_found'; end if;

  update public.programs set status = p_status, updated_at = now() where id = p_program_id;
  select coalesce(full_name, email, 'Platform administrator')
  into v_actor_name
  from public.profiles
  where id = auth.uid();

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  values (
    p_program_id,
    auth.uid(),
    coalesce(v_actor_name, 'Platform administrator'),
    'program_status_changed',
    jsonb_build_object('previous', v_previous, 'next', p_status, 'reason', nullif(trim(coalesce(p_reason, '')), ''))::text
  );
end;
$$;

revoke all on function public.set_program_status(uuid, public.program_status, text) from public;
grant execute on function public.set_program_status(uuid, public.program_status, text) to authenticated;
