-- Forward-only Loyality review repair. Apply the whole file in ONE transaction.
-- No business data is deleted or reassigned. Historical migrations stay intact.
-- Preflight first: supabase/diagnostics/loyality-integrity-preflight.sql.
set local lock_timeout = '5s';
lock table public.businesses, public.program_memberships, public.member_transactions,
  public.loyality_business_settings, public.loyality_offers, public.loyality_offer_claims,
  public.loyality_visit_rules, public.loyality_visits, public.loyality_voucher_catalog,
  public.loyality_vouchers, public.loyality_raffles, public.loyality_raffle_entries
  in share row exclusive mode;

-- Freeze writes during audit/validation so a new inconsistent row cannot race it.
do $$
declare v_issues text;
begin
  select string_agg(table_name || ':' || record_id::text || ':' || reason, E'\n')
  into v_issues from (
select 'loyality_business_settings'::text as table_name, r.business_id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_business_settings r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_offers'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_offers r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_offer_claims r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_visit_rules'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_visit_rules r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_visits'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_visits r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_voucher_catalog'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_voucher_catalog r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_vouchers r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_raffles'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_raffles r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'business_program_mismatch'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.businesses b where b.id=r.business_id and b.program_id=r.program_id)
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_offer_claims r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_visits'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_visits r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_vouchers r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'customer_program_membership_missing'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.customer_id and pm.role='member')
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'referrer_program_membership_missing'::text as reason
from public.loyality_offer_claims r where r.referrer_id is not null and not exists (select 1 from public.program_memberships pm where pm.program_id=r.program_id and pm.profile_id=r.referrer_id and pm.role='member')
union all
select 'loyality_offer_claims'::text as table_name, r.id as record_id, 'offer_reference_mismatch'::text as reason
from public.loyality_offer_claims r where not exists (select 1 from public.loyality_offers s where s.id=r.offer_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_visits'::text as table_name, r.id as record_id, 'transaction_reference_mismatch'::text as reason
from public.loyality_visits r where not exists (select 1 from public.member_transactions s where s.id=r.member_transaction_id and s.business_id=r.business_id and s.program_id=r.program_id and s.profile_id=r.customer_id)
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'transaction_reference_mismatch'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.member_transactions s where s.id=r.member_transaction_id and s.business_id=r.business_id and s.program_id=r.program_id and s.profile_id=r.customer_id)
union all
select 'loyality_raffle_entries'::text as table_name, r.id as record_id, 'raffle_reference_mismatch'::text as reason
from public.loyality_raffle_entries r where not exists (select 1 from public.loyality_raffles s where s.id=r.raffle_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'voucher_source_missing'::text as reason
from public.loyality_vouchers r where r.source_kind <> 'manual' and (r.source_id is null or r.source_event_id is null)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'acquisition_offer_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='acquisition_offer' and not exists (select 1 from public.loyality_offer_claims s where s.id=r.source_event_id and s.offer_id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id and s.customer_id=r.customer_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'referral_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='referral' and not exists (select 1 from public.loyality_offer_claims s where s.id=r.source_event_id and s.offer_id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id and s.referrer_id=r.customer_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'visit_rule_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='visit_rule' and not exists (select 1 from public.loyality_visit_rules s where s.id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'points_catalog_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='points_catalog' and not exists (select 1 from public.loyality_voucher_catalog s where s.id=r.source_id and s.business_id=r.business_id and s.program_id=r.program_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'visit_transaction_source_mismatch'::text as reason
from public.loyality_vouchers r where r.source_kind='visit_rule' and not exists (select 1 from public.member_transactions s where s.id=r.source_event_id and s.business_id=r.business_id and s.program_id=r.program_id and s.profile_id=r.customer_id)
union all
select 'loyality_vouchers'::text as table_name, r.id as record_id, 'catalog_request_reused'::text as reason
from public.loyality_vouchers r where r.source_kind='points_catalog' and exists (select 1 from public.loyality_vouchers s where s.source_kind='points_catalog' and s.customer_id=r.customer_id and s.source_event_id=r.source_event_id and s.id<>r.id)
  limit 25) issues;
  if v_issues is not null then
    raise exception 'Loyality integrity preflight failed; no records changed.'
      using detail=v_issues, hint='Run supabase/diagnostics/loyality-integrity-preflight.sql and resolve each record with its owner before retrying.';
  end if;
end;
$$;

-- Composite references also prevent reparenting referenced source rows later.
alter table public.businesses add constraint loyality_business_program_key unique(id,program_id);
-- The existing identity-role index already permits only one member per program.
-- A nullable generated key exposes that identity to foreign keys while preserving
-- multiple staff/owner memberships and historical suspended memberships.
alter table public.program_memberships
  add column loyality_member_profile_id uuid generated always as
    (case when role='member'::public.program_role then profile_id end) stored,
  add constraint loyality_member_program_key unique(program_id,loyality_member_profile_id);
alter table public.member_transactions add constraint loyality_transaction_identity_key
  unique(id,business_id,program_id,profile_id);


alter table public.loyality_business_settings add constraint loyality_business_settings_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_offers add constraint loyality_offers_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_offer_claims add constraint loyality_offer_claims_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_visit_rules add constraint loyality_visit_rules_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_visits add constraint loyality_visits_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_voucher_catalog add constraint loyality_voucher_catalog_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_vouchers add constraint loyality_vouchers_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_raffles add constraint loyality_raffles_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_raffle_entries add constraint loyality_raffle_entries_business_fk
  foreign key(business_id,program_id) references public.businesses(id,program_id);

alter table public.loyality_offers add constraint loyality_offers_identity_key unique(id,business_id,program_id);

alter table public.loyality_visit_rules add constraint loyality_visit_rules_identity_key unique(id,business_id,program_id);

alter table public.loyality_voucher_catalog add constraint loyality_voucher_catalog_identity_key unique(id,business_id,program_id);

alter table public.loyality_raffles add constraint loyality_raffles_identity_key unique(id,business_id,program_id);

alter table public.loyality_offer_claims add constraint loyality_offer_claims_customer_fk
  foreign key(program_id,customer_id) references public.program_memberships(program_id,loyality_member_profile_id);

alter table public.loyality_visits add constraint loyality_visits_customer_fk
  foreign key(program_id,customer_id) references public.program_memberships(program_id,loyality_member_profile_id);

alter table public.loyality_vouchers add constraint loyality_vouchers_customer_fk
  foreign key(program_id,customer_id) references public.program_memberships(program_id,loyality_member_profile_id);

alter table public.loyality_raffle_entries add constraint loyality_raffle_entries_customer_fk
  foreign key(program_id,customer_id) references public.program_memberships(program_id,loyality_member_profile_id);

alter table public.loyality_offer_claims
  add constraint loyality_claim_referrer_fk foreign key(program_id,referrer_id)
    references public.program_memberships(program_id,loyality_member_profile_id),
  add constraint loyality_claim_offer_fk foreign key(offer_id,business_id,program_id)
    references public.loyality_offers(id,business_id,program_id),
  add constraint loyality_claim_customer_source_key unique(id,offer_id,business_id,program_id,customer_id),
  add constraint loyality_claim_referrer_source_key unique(id,offer_id,business_id,program_id,referrer_id);
alter table public.loyality_visits add constraint loyality_visit_transaction_fk
  foreign key(member_transaction_id,business_id,program_id,customer_id)
  references public.member_transactions(id,business_id,program_id,profile_id);
alter table public.loyality_raffle_entries
  add constraint loyality_entry_transaction_fk foreign key(member_transaction_id,business_id,program_id,customer_id)
    references public.member_transactions(id,business_id,program_id,profile_id),
  add constraint loyality_entry_raffle_fk foreign key(raffle_id,business_id,program_id)
    references public.loyality_raffles(id,business_id,program_id);

-- Typed source projections make polymorphic voucher references enforceable by
-- real FKs on both child writes and parent updates/deletes, including definer RPCs.
alter table public.loyality_vouchers
  add column acquisition_claim_id uuid generated always as (case when source_kind='acquisition_offer' then source_event_id end) stored,
  add column referral_claim_id uuid generated always as (case when source_kind='referral' then source_event_id end) stored,
  add column visit_rule_id uuid generated always as (case when source_kind='visit_rule' then source_id end) stored,
  add column visit_transaction_id uuid generated always as (case when source_kind='visit_rule' then source_event_id end) stored,
  add column catalog_item_id uuid generated always as (case when source_kind='points_catalog' then source_id end) stored,
  add constraint loyality_voucher_source_required check(source_kind='manual' or (source_id is not null and source_event_id is not null)),
  add constraint loyality_voucher_acquisition_fk foreign key(acquisition_claim_id,source_id,business_id,program_id,customer_id)
    references public.loyality_offer_claims(id,offer_id,business_id,program_id,customer_id),
  add constraint loyality_voucher_referral_fk foreign key(referral_claim_id,source_id,business_id,program_id,customer_id)
    references public.loyality_offer_claims(id,offer_id,business_id,program_id,referrer_id),
  add constraint loyality_voucher_rule_fk foreign key(visit_rule_id,business_id,program_id)
    references public.loyality_visit_rules(id,business_id,program_id),
  add constraint loyality_voucher_transaction_fk foreign key(visit_transaction_id,business_id,program_id,customer_id)
    references public.member_transactions(id,business_id,program_id,profile_id),
  add constraint loyality_voucher_catalog_fk foreign key(catalog_item_id,business_id,program_id)
    references public.loyality_voucher_catalog(id,business_id,program_id);
create unique index loyality_catalog_request_once_idx on public.loyality_vouchers(customer_id,source_event_id)
  where source_kind='points_catalog';

create or replace function public.can_configure_loyality_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.businesses b where b.id=p_business_id and b.active and (
      public.is_platform_admin() or exists (
        select 1 from public.program_memberships pm
        where pm.profile_id=(select auth.uid()) and pm.program_id=b.program_id and pm.status='active'
          and (pm.role='program-admin' or (pm.role='business-owner' and pm.business_id=b.id))
      )
    )
  );
$$;
revoke all on function public.can_configure_loyality_business(uuid) from public,anon,authenticated;
grant execute on function public.can_configure_loyality_business(uuid) to authenticated;

-- Retain this existing helper's operational meaning for staff reads/redemption,
-- replacing stale JWT business roles with current database membership.
create or replace function public.can_manage_loyality_business(p_business_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select public.can_configure_loyality_business(p_business_id) or exists (
    select 1 from public.businesses b join public.program_memberships pm
      on pm.program_id=b.program_id and pm.business_id=b.id
    where b.id=p_business_id and b.active and pm.profile_id=(select auth.uid())
      and pm.status='active' and pm.role='business-staff'
  );
$$;
revoke all on function public.can_manage_loyality_business(uuid) from public,anon,authenticated;
grant execute on function public.can_manage_loyality_business(uuid) to authenticated;


alter policy "Business team manages Loyality offers" on public.loyality_offers
  using(public.can_configure_loyality_business(business_id))
  with check(public.can_configure_loyality_business(business_id));
create policy "Active business team reads Loyality offers" on public.loyality_offers
  for select to authenticated using(public.can_manage_loyality_business(business_id));

alter policy "Business team manages Loyality visit rules" on public.loyality_visit_rules
  using(public.can_configure_loyality_business(business_id))
  with check(public.can_configure_loyality_business(business_id));
create policy "Active business team reads Loyality visit rules" on public.loyality_visit_rules
  for select to authenticated using(public.can_manage_loyality_business(business_id));

alter policy "Business team manages Loyality voucher catalog" on public.loyality_voucher_catalog
  using(public.can_configure_loyality_business(business_id))
  with check(public.can_configure_loyality_business(business_id));
create policy "Active business team reads Loyality voucher catalog" on public.loyality_voucher_catalog
  for select to authenticated using(public.can_manage_loyality_business(business_id));

alter policy "Business team manages Loyality raffles" on public.loyality_raffles
  using(public.can_configure_loyality_business(business_id))
  with check(public.can_configure_loyality_business(business_id));
create policy "Active business team reads Loyality raffles" on public.loyality_raffles
  for select to authenticated using(public.can_manage_loyality_business(business_id));

alter policy "Business team updates Loyality settings" on public.loyality_business_settings
  using(public.can_configure_loyality_business(business_id))
  with check(public.can_configure_loyality_business(business_id));
grant update on public.loyality_business_settings to authenticated;
-- These are RPC-owned records; the original grants offered no legitimate direct
-- write path. Keep only SELECT rather than relying on missing write policies.
revoke insert,update,delete on public.loyality_offer_claims,public.loyality_vouchers from authenticated;


alter policy "Customers read own Loyality claims" on public.loyality_offer_claims
  using(customer_id=(select auth.uid()) and exists (
    select 1 from public.program_memberships pm where pm.program_id=loyality_offer_claims.program_id
    and pm.profile_id=(select auth.uid()) and pm.role='member' and pm.status='active'
  ));

alter policy "Customers read own Loyality visits" on public.loyality_visits
  using(customer_id=(select auth.uid()) and exists (
    select 1 from public.program_memberships pm where pm.program_id=loyality_visits.program_id
    and pm.profile_id=(select auth.uid()) and pm.role='member' and pm.status='active'
  ));

alter policy "Customers read own Loyality vouchers" on public.loyality_vouchers
  using(customer_id=(select auth.uid()) and exists (
    select 1 from public.program_memberships pm where pm.program_id=loyality_vouchers.program_id
    and pm.profile_id=(select auth.uid()) and pm.role='member' and pm.status='active'
  ));

alter policy "Customers read own Loyality raffle entries" on public.loyality_raffle_entries
  using(customer_id=(select auth.uid()) and exists (
    select 1 from public.program_memberships pm where pm.program_id=loyality_raffle_entries.program_id
    and pm.profile_id=(select auth.uid()) and pm.role='member' and pm.status='active'
  ));

create or replace function public.redeem_loyality_catalog_voucher(
  p_catalog_id uuid,
  p_client_request_id uuid
)
returns public.loyality_vouchers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_catalog public.loyality_voucher_catalog%rowtype;
  v_balance public.reward_balances%rowtype;
  v_voucher public.loyality_vouchers%rowtype;
begin
  if v_actor_id is null then raise exception 'Sign in to choose a voucher.'; end if;
  if p_client_request_id is null then raise exception 'A request ID is required.'; end if;

  -- Actor/request lock precedes every replay lookup and point mutation.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'loyality-catalog:' || v_actor_id::text || ':' || p_client_request_id::text, 0));

  select * into v_voucher from public.loyality_vouchers
  where customer_id=v_actor_id and source_kind='points_catalog' and source_event_id=p_client_request_id;
  if v_voucher.id is not null then
    if v_voucher.source_id is distinct from p_catalog_id then
      raise exception 'This request was already used for a different voucher.';
    end if;
    if not exists (select 1 from public.program_memberships pm
      where pm.program_id=v_voucher.program_id and pm.profile_id=v_actor_id
        and pm.role='member' and pm.status='active') then
      raise exception 'This customer account does not belong to this Loyality program.';
    end if;
    return v_voucher;
  end if;

  select c.* into v_catalog from public.loyality_voucher_catalog c
  join public.businesses b on b.id=c.business_id and b.program_id=c.program_id and b.active
  where c.id=p_catalog_id and c.active for share of c;
  if v_catalog.id is null then raise exception 'Voucher option not found.' using errcode='LY001'; end if;
  if not exists (select 1 from public.program_memberships pm
    where pm.program_id=v_catalog.program_id and pm.profile_id=v_actor_id
      and pm.role='member' and pm.status='active') then
    raise exception 'This customer account does not belong to this Loyality program.';
  end if;

  select * into v_balance
  from public.reward_balances
  where program_id = v_catalog.program_id and profile_id = v_actor_id
  for update;
  if v_balance.id is null or v_balance.points < v_catalog.points_cost then
    raise exception 'Not enough points for this voucher.' using errcode='LY001';
  end if;

  update public.reward_balances
  set points = points - v_catalog.points_cost, updated_at = now()
  where id = v_balance.id;

  insert into public.loyality_vouchers (
    program_id, business_id, customer_id, title, description,
    voucher_kind, voucher_value, source_kind, source_id, source_event_id
  ) values (
    v_catalog.program_id,
    v_catalog.business_id,
    v_actor_id,
    v_catalog.title,
    v_catalog.description,
    v_catalog.voucher_kind,
    v_catalog.voucher_value,
    'points_catalog',
    v_catalog.id,
    p_client_request_id
  ) returning * into v_voucher;

  return v_voucher;
end;
$$;

create or replace function public.claim_loyality_offer(
  p_offer_token text,
  p_referrer_code text default null,
  p_source_label text default null
)
returns public.loyality_vouchers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_offer public.loyality_offers%rowtype;
  v_referrer_id uuid;
  v_claim public.loyality_offer_claims%rowtype;
  v_voucher public.loyality_vouchers%rowtype;
begin
  if v_actor_id is null then
    raise exception 'Sign in as a customer to claim this offer.';
  end if;

  select o.* into v_offer
  from public.loyality_offers o
  join public.businesses b on b.id=o.business_id and b.program_id=o.program_id and b.active
  where o.public_token = pg_catalog.btrim(p_offer_token)
    and o.active
    and starts_at <= now()
    and (ends_at is null or ends_at > now());

  if v_offer.id is null then
    raise exception 'This offer is no longer available.';
  end if;

  if not exists (select 1 from public.program_memberships pm where pm.program_id=v_offer.program_id and pm.profile_id=v_actor_id and pm.role='member' and pm.status='active') then
    raise exception 'This customer account does not belong to this Loyality program.';
  end if;

  if nullif(pg_catalog.btrim(p_referrer_code), '') is not null then
    select p.id into v_referrer_id
    from public.profiles p
    join public.program_memberships pm
      on pm.profile_id = p.id
     and pm.program_id = v_offer.program_id
     and pm.role::text = 'member'
     and pm.status::text = 'active'
    where p.referral_code = pg_catalog.upper(pg_catalog.btrim(p_referrer_code))
      and p.id <> v_actor_id
    limit 1;
  end if;

  insert into public.loyality_offer_claims (
    program_id, business_id, offer_id, customer_id, referrer_id, source_label
  ) values (
    v_offer.program_id,
    v_offer.business_id,
    v_offer.id,
    v_actor_id,
    v_referrer_id,
    coalesce(nullif(pg_catalog.btrim(p_source_label), ''), v_offer.source_label)
  )
  on conflict (offer_id, customer_id) do update
  set source_label = excluded.source_label
  returning * into v_claim;

  select * into v_voucher
  from public.loyality_vouchers
  where customer_id = v_actor_id
    and source_kind = 'acquisition_offer'
    and source_id = v_offer.id
    and source_event_id = v_claim.id
  limit 1;

  if v_voucher.id is null then
    insert into public.loyality_vouchers (
      program_id, business_id, customer_id, title, description,
      voucher_kind, voucher_value, source_kind, source_id, source_event_id
    ) values (
      v_offer.program_id,
      v_offer.business_id,
      v_actor_id,
      v_offer.reward_title,
      v_offer.reward_description,
      v_offer.reward_kind,
      v_offer.reward_value,
      'acquisition_offer',
      v_offer.id,
      v_claim.id
    ) returning * into v_voucher;
  end if;

  return v_voucher;
end;
$$;

create or replace function public.redeem_loyality_voucher(p_public_token text)
returns public.loyality_vouchers
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := (select auth.uid());
  v_voucher public.loyality_vouchers%rowtype;
  v_claim public.loyality_offer_claims%rowtype;
  v_settings public.loyality_business_settings%rowtype;
begin
  select v.* into v_voucher
  from public.loyality_vouchers v
  join public.businesses b on b.id=v.business_id and b.program_id=v.program_id
  where v.public_token = pg_catalog.btrim(p_public_token)
  for update of v;

  if v_voucher.id is null then
    raise exception 'Voucher not found.';
  end if;
  if not public.can_manage_loyality_business(v_voucher.business_id) then
    raise exception 'This staff account cannot redeem this voucher.';
  end if;
  if not exists (select 1 from public.program_memberships pm where pm.program_id=v_voucher.program_id and pm.profile_id=v_voucher.customer_id and pm.role='member' and pm.status='active') then
    raise exception 'Customer is not an active member of this rewards program';
  end if;
  if v_voucher.status <> 'active' then
    raise exception 'This voucher is not active.';
  end if;

  update public.loyality_vouchers
  set status = 'redeemed', redeemed_at = now(), redeemed_by = v_actor_id, updated_at = now()
  where id = v_voucher.id
  returning * into v_voucher;

  if v_voucher.source_kind = 'acquisition_offer' and v_voucher.source_event_id is not null then
    select * into v_claim
    from public.loyality_offer_claims
    where id = v_voucher.source_event_id
    for update;

    update public.loyality_offer_claims
    set status = 'redeemed', redeemed_at = now()
    where id = v_claim.id;

    if v_claim.referrer_id is not null and v_claim.referral_reward_issued_at is null then
      select * into v_settings
      from public.loyality_business_settings
      where business_id = v_claim.business_id;

      insert into public.loyality_vouchers (
        program_id, business_id, customer_id, title, description,
        voucher_kind, voucher_value, source_kind, source_id, source_event_id
      ) values (
        v_claim.program_id,
        v_claim.business_id,
        v_claim.referrer_id,
        coalesce(v_settings.referral_reward_title, 'Referral thank-you'),
        coalesce(v_settings.referral_reward_description, 'Thanks for introducing a new customer.'),
        coalesce(v_settings.referral_reward_kind, 'item'),
        v_settings.referral_reward_value,
        'referral',
        v_claim.offer_id,
        v_claim.id
      ) on conflict do nothing;

      update public.loyality_offer_claims
      set referral_reward_issued_at = now()
      where id = v_claim.id;
    end if;
  end if;

  insert into public.admin_logs (program_id, actor_id, actor_name, action, details)
  select
    v_voucher.program_id,
    v_actor_id,
    coalesce(nullif(p.full_name, ''), 'Business staff'),
    'Loyality voucher redeemed',
    pg_catalog.format('Redeemed "%s" for customer ID %s.', v_voucher.title, v_voucher.customer_id)
  from public.profiles p
  where p.id = v_actor_id;

  return v_voucher;
end;
$$;

create or replace function public.process_loyality_member_transaction()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enabled boolean := false;
  v_visit_number integer;
  v_rule public.loyality_visit_rules%rowtype;
  v_raffle public.loyality_raffles%rowtype;
begin
  select coalesce((feature_flags ->> 'loyalitySingleBusiness')::boolean, false)
  into v_enabled
  from public.programs
  where id = new.program_id;

  if not v_enabled then return new; end if;

  -- Distinct actors and receipts for one customer share this transaction lock.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'loyality-visits:' || new.business_id::text || ':' || new.profile_id::text, 0));

  select coalesce(max(visit_number),0) + 1 into v_visit_number
  from public.loyality_visits
  where business_id = new.business_id and customer_id = new.profile_id;

  insert into public.loyality_visits (
    program_id, business_id, customer_id, member_transaction_id,
    visit_number, purchase_amount, visited_at
  ) values (
    new.program_id, new.business_id, new.profile_id, new.id,
    v_visit_number, new.purchase_amount, new.created_at
  ) on conflict (member_transaction_id) do nothing;

  for v_rule in
    select * from public.loyality_visit_rules
    where program_id = new.program_id
      and business_id = new.business_id
      and active
      and v_visit_number >= trigger_visit_count
      and (
        v_visit_number = trigger_visit_count
        or (repeat_every is not null and pg_catalog.mod(v_visit_number - trigger_visit_count, repeat_every) = 0)
      )
  loop
    insert into public.loyality_vouchers (
      program_id, business_id, customer_id, title, description,
      voucher_kind, voucher_value, source_kind, source_id, source_event_id
    ) values (
      new.program_id, new.business_id, new.profile_id,
      v_rule.reward_title, v_rule.reward_description,
      v_rule.reward_kind, v_rule.reward_value,
      'visit_rule', v_rule.id, new.id
    ) on conflict (customer_id,source_kind,source_id,source_event_id)
      where source_id is not null and source_event_id is not null do nothing;
  end loop;

  for v_raffle in
    select * from public.loyality_raffles
    where program_id = new.program_id
      and business_id = new.business_id
      and status = 'active'
      and starts_at <= new.created_at
      and ends_at > new.created_at
      and new.purchase_amount >= minimum_purchase
  loop
    insert into public.loyality_raffle_entries (
      program_id, business_id, raffle_id, customer_id,
      member_transaction_id, entry_count
    ) values (
      new.program_id, new.business_id, v_raffle.id, new.profile_id,
      new.id, v_raffle.entries_per_purchase
    ) on conflict (raffle_id, member_transaction_id) do nothing;
  end loop;

  return new;
end;
$$;

create or replace function public.record_member_transaction_once(
  p_member_qr_token text,
  p_purchase_amount numeric,
  p_receipt_number text,
  p_note text default null,
  p_client_request_id uuid default null
)
returns public.member_transactions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_id uuid := auth.uid();
  actor_profile public.profiles%rowtype;
  business_row public.businesses%rowtype;
  member_profile public.profiles%rowtype;
  existing_transaction public.member_transactions%rowtype;
  existing_receipt_transaction public.member_transactions%rowtype;
  inserted_transaction public.member_transactions%rowtype;
  purchase_amount_value numeric(12,2);
  receipt_number_value text;
  reward_value_value numeric(12,2);
  points_awarded_value integer;
  commission_amount_value numeric(12,2);
  v_constraint_name text;
begin
  if v_actor_id is null then
    raise exception 'Authentication required';
  end if;

  if p_client_request_id is not null then
    select transaction_row.* into existing_transaction
    from public.member_transactions transaction_row
    where transaction_row.recorded_by = v_actor_id
      and transaction_row.client_request_id = p_client_request_id
    limit 1;

    if found then
      return existing_transaction;
    end if;
  end if;

  select profile_row.* into actor_profile
  from public.profiles profile_row
  where profile_row.id = v_actor_id;

  if actor_profile.role not in ('business-owner', 'business-staff')
    or actor_profile.business_id is null then
    raise exception 'Permission denied';
  end if;

  select business.* into business_row
  from public.businesses business
  where business.id = actor_profile.business_id
    and business.active = true
  for share;

  if not found then
    raise exception 'Business not found.';
  end if;

  if not exists (
    select 1
    from public.program_memberships membership
    where membership.program_id = business_row.program_id
      and membership.profile_id = v_actor_id
      and membership.role::text = actor_profile.role::text
      and membership.business_id = business_row.id
      and membership.status = 'active'
  ) then
    raise exception 'Permission denied';
  end if;

  select profile_row.* into member_profile
  from public.profiles profile_row
  where profile_row.member_qr_token = p_member_qr_token
    and profile_row.role = 'customer';

  if not found then
    raise exception 'Member not found.';
  end if;

  if not exists (
    select 1
    from public.program_memberships membership
    where membership.program_id = business_row.program_id
      and membership.profile_id = member_profile.id
      and membership.role = 'member'
      and membership.status = 'active'
  ) then
    raise exception 'Customer is not an active member of this rewards program';
  end if;

  perform public.assert_member_verified(member_profile.id);

  if p_purchase_amount is null or p_purchase_amount <= 0 then
    raise exception 'Purchase amount must be greater than 0.';
  end if;

  receipt_number_value := nullif(trim(coalesce(p_receipt_number, '')), '');
  if receipt_number_value is null or length(receipt_number_value) < 3 then
    raise exception 'Receipt or bill number is required.';
  end if;

  select transaction_row.* into existing_receipt_transaction
  from public.member_transactions transaction_row
  where transaction_row.program_id = business_row.program_id
    and transaction_row.business_id = business_row.id
    and lower(trim(transaction_row.receipt_number)) = lower(receipt_number_value)
  limit 1;

  if found then
    raise exception 'This receipt or bill number has already been recorded.';
  end if;

  purchase_amount_value := round(p_purchase_amount::numeric, 2);
  reward_value_value := round((purchase_amount_value * business_row.reward_rate_percent / 100)::numeric, 2);
  points_awarded_value := floor(reward_value_value);
  commission_amount_value := round((purchase_amount_value * business_row.commission_rate_percent / 100)::numeric, 2);

  insert into public.member_transactions (
    program_id,
    profile_id,
    business_id,
    purchase_amount,
    receipt_number,
    reward_rate_percent,
    reward_value,
    points_awarded,
    commission_rate_percent,
    commission_amount,
    recorded_by,
    note,
    client_request_id
  )
  values (
    business_row.program_id,
    member_profile.id,
    business_row.id,
    purchase_amount_value,
    receipt_number_value,
    business_row.reward_rate_percent,
    reward_value_value,
    points_awarded_value,
    business_row.commission_rate_percent,
    commission_amount_value,
    v_actor_id,
    nullif(trim(coalesce(p_note, '')), ''),
    p_client_request_id
  )
  returning * into inserted_transaction;

  insert into public.reward_balances (program_id, profile_id)
  values (business_row.program_id, member_profile.id)
  on conflict (program_id, profile_id) do nothing;

  update public.reward_balances
  set points = points + points_awarded_value,
      updated_at = now()
  where program_id = business_row.program_id
    and profile_id = member_profile.id;

  insert into public.activities (
    program_id,
    profile_id,
    business_id,
    type,
    title,
    description,
    points,
    status
  )
  values (
    business_row.program_id,
    member_profile.id,
    business_row.id,
    'earned',
    format(
      'Purchase at %s - %s %s',
      business_row.name,
      business_row.currency,
      to_char(purchase_amount_value, 'FM999999990.00')
    ),
    format(
      '%s %s reward value issued from receipt %s.',
      business_row.currency,
      to_char(reward_value_value, 'FM999999990.00'),
      receipt_number_value
    ),
    points_awarded_value,
    'posted'
  );

  insert into public.admin_logs (
    program_id,
    actor_id,
    actor_name,
    action,
    details
  )
  values (
    business_row.program_id,
    v_actor_id,
    coalesce(actor_profile.full_name, 'Business staff'),
    'Member QR transaction recorded',
    format(
      'Recorded receipt %s for %s %s for %s at %s. Awarded %s points. Commission owed: %s %s.',
      receipt_number_value,
      business_row.currency,
      to_char(purchase_amount_value, 'FM999999990.00'),
      member_profile.full_name,
      business_row.name,
      points_awarded_value,
      business_row.currency,
      to_char(commission_amount_value, 'FM999999990.00')
    )
  );

  return inserted_transaction;
exception
  when unique_violation then
    get stacked diagnostics v_constraint_name = CONSTRAINT_NAME;
    if v_constraint_name = 'member_transactions_recorded_by_client_request_id_key'
      and p_client_request_id is not null then
      select transaction_row.* into existing_transaction
      from public.member_transactions transaction_row
      where transaction_row.recorded_by = v_actor_id
        and transaction_row.client_request_id = p_client_request_id
      limit 1;

      if found then
        return existing_transaction;
      end if;
    end if;

    if v_constraint_name = 'member_transactions_business_receipt_number_key' then
      raise exception 'This receipt or bill number has already been recorded.';
    end if;
    raise;
end;
$$;

revoke all on function public.record_member_transaction_once(text,numeric,text,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.process_loyality_member_transaction() from public,anon,authenticated;
revoke all on function public.claim_loyality_offer(text,text,text) from public,anon;
revoke all on function public.redeem_loyality_catalog_voucher(uuid,uuid) from public,anon;
revoke all on function public.redeem_loyality_voucher(text) from public,anon;
grant execute on function public.claim_loyality_offer(text,text,text), public.redeem_loyality_catalog_voucher(uuid,uuid), public.redeem_loyality_voucher(text) to authenticated;
notify pgrst, 'reload schema';
