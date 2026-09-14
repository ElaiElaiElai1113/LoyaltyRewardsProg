-- Free-first RewardMe. Preserve historical subscriptions and balances.
create table public.rewardme_membership_tiers (
 program_id uuid not null references public.programs(id) on delete restrict,
 tier text not null check(tier in ('free','regular','gold')),
 available boolean not null default false,
 price_minor bigint check(price_minor>=0), currency text check(currency ~ '^[A-Z]{3}$'),
 benefits jsonb, terms_version text,
 primary key(program_id,tier),
 constraint rewardme_paid_terms_pending check(tier='free' or available=false)
);
alter table public.rewardme_membership_tiers enable row level security;
revoke all on public.rewardme_membership_tiers from public,anon,authenticated,service_role;
grant select on public.rewardme_membership_tiers to anon,authenticated,service_role;
create policy rewardme_tiers_public_read on public.rewardme_membership_tiers for select to anon,authenticated using (exists(select 1 from public.programs p where p.id=program_id and p.status='active'));
insert into public.rewardme_membership_tiers(program_id,tier,available)
select id,tier,tier='free' from public.programs cross join (values('free'),('regular'),('gold')) tiers(tier) where slug='pinas';

create function public.get_rewardme_member_entitlements(p_program_id uuid) returns jsonb
language plpgsql stable security definer set search_path=pg_catalog,public as $$
declare eligible boolean;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 if not exists(select 1 from public.programs where id=p_program_id and slug='pinas' and status='active') then raise exception 'rewardme_program_required'; end if;
 select exists(select 1 from public.program_memberships where program_id=p_program_id and profile_id=auth.uid() and role='member' and status='active') into eligible;
 return jsonb_build_object('tier','free','canEarn',eligible,'canRedeem',eligible,'paidActivationAvailable',false);
end $$;
revoke all on function public.get_rewardme_member_entitlements(uuid) from public,anon;
grant execute on function public.get_rewardme_member_entitlements(uuid) to authenticated;

-- Existing owner operations remain able to cancel/review history. Prevent new paid
-- activation/renewal through any old RPC until accepted commercial terms exist.
create function public.guard_rewardme_paid_activation() returns trigger
language plpgsql set search_path=pg_catalog,public as $$
begin
 if not exists(select 1 from public.programs where id=new.program_id and slug='pinas') then return new; end if;
 if new.status::text<>'active' then return new; end if;
 if tg_op='UPDATE' then
  if new.program_id=old.program_id and new.profile_id=old.profile_id and new.tier=old.tier and new.status=old.status
   and new.current_period_end<=old.current_period_end and new.price_cents=old.price_cents and new.currency=old.currency
   and new.current_period_start=old.current_period_start then return new; end if;
 end if;
 raise exception 'rewardme_paid_activation_pending_approved_terms';
end $$;
create trigger rewardme_paid_activation_guard before insert or update on public.memberships for each row execute function public.guard_rewardme_paid_activation();
revoke all on function public.guard_rewardme_paid_activation() from public,anon,authenticated,service_role;
