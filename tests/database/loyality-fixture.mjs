// Isolated PostgreSQL fixture. Application tables/functions below are loaded from
// the historical migrations verbatim. This is a focused dependency fixture, not
// a substitute for replaying every historical migration or running GoTrue.
import { readFileSync } from 'node:fs';

const read = (file) => readFileSync(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8');
export function historicalFunction(file, name) {
  const sql = read(file);
  const start = sql.indexOf(`create or replace function public.${name}(`);
  if (start < 0) throw new Error(`Missing historical function ${name}`);
  const end = sql.indexOf('$$;', start);
  return sql.slice(start, end + 3);
}
export const platformMigration = '20260824170041_loyality_single_business_platform.sql';
export function fixtureSql() {
  const foundation = read('20260725000000_four_brand_saas_foundation.sql');
  const sales = read('20260521000000_member_transactions.sql');
  const loyality = read(platformMigration);
  return `
create schema auth;
create table auth.users(id uuid primary key);
-- Same database-boundary claims used by Supabase/PostgREST; no auth server is simulated.
create function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
   nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
 select nullif(current_setting('request.jwt.claims', true), '')::jsonb
$$;
grant usage on schema auth to authenticated, anon, service_role;
create extension pgcrypto;
create publication supabase_realtime;
${read('20260412000000_schema.sql')}
alter type public.user_role add value 'business-staff';
${foundation.slice(0, foundation.indexOf('insert into public.programs ('))}
alter table public.businesses add column program_id uuid not null references public.programs(id);
alter table public.profiles add column member_qr_token text unique;
alter table public.businesses add column address text not null default '';
${sales.slice(sales.indexOf('alter table public.businesses'), sales.indexOf('drop policy if exists'))}
alter table public.member_transactions add column program_id uuid not null references public.programs(id);
alter table public.member_transactions add column receipt_number text;
create unique index member_transactions_business_receipt_number_key
 on public.member_transactions(business_id, lower(trim(receipt_number)))
 where receipt_number is not null and length(trim(receipt_number)) > 0;
alter table public.reward_balances add column program_id uuid not null references public.programs(id);
alter table public.reward_balances drop constraint reward_balances_profile_id_key;
alter table public.reward_balances add unique(program_id, profile_id);
alter table public.activities add column program_id uuid not null references public.programs(id);
alter table public.admin_logs add column program_id uuid not null references public.programs(id);
-- Only these columns are queried by the real sale replay wrapper; gift-card
-- mutation functions are deliberately outside this fixture's scope.
create table public.gift_card_events(actor_id uuid, metadata jsonb);
${historicalFunction('20260725000000_four_brand_saas_foundation.sql', 'is_platform_admin')}
${historicalFunction('20260725000000_four_brand_saas_foundation.sql', 'is_program_member')}
${historicalFunction('20260519000100_restore_jwt_role_helper.sql', 'jwt_role')}
${historicalFunction('20260415000000_fix_jwt_claims_and_seed_business.sql', 'current_business_id')}
${historicalFunction('20260429000000_gift_cards.sql', 'can_manage_business')}
${historicalFunction('20260705010000_launch_contact_signup_relax_id_verification.sql', 'is_member_verified')}
${historicalFunction('20260705010000_launch_contact_signup_relax_id_verification.sql', 'assert_member_verified')}
${historicalFunction('20260817125922_fix_idempotency_actor_id_ambiguity.sql', 'record_member_transaction_once')}
${historicalFunction('20260817152354_fix_composite_rpc_wrapper_assignment.sql', 'record_member_transaction')}
revoke all on function public.record_member_transaction_once(text,numeric,text,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.record_member_transaction(text,numeric,text,text,uuid) from public,anon,service_role;
grant execute on function public.record_member_transaction(text,numeric,text,text,uuid) to authenticated;
${read('20260725010000_tenant_write_guards.sql').split('create or replace function public.get_plan_entitlements')[0]}
${loyality.slice(loyality.indexOf('create table if not exists public.loyality_business_settings'), loyality.indexOf('insert into public.loyality_business_settings ('))}
alter table public.program_memberships enable row level security;
${foundation.slice(foundation.indexOf('create policy "users read program memberships"'), foundation.indexOf('create or replace function public.create_program('))}
grant select on public.businesses, public.profiles, public.program_memberships to authenticated;
`;
}

export const ids = {
  programA: 'a0000000-0000-4000-8000-000000000001', programB: 'b0000000-0000-4000-8000-000000000001',
  businessA: 'a0000000-0000-4000-8000-000000000002', businessB: 'b0000000-0000-4000-8000-000000000002',
  owner: 'a0000000-0000-4000-8000-000000000003', staff: 'a0000000-0000-4000-8000-000000000004',
  member: 'a0000000-0000-4000-8000-000000000005', memberB: 'b0000000-0000-4000-8000-000000000005',
  admin: 'a0000000-0000-4000-8000-000000000006', platformAdmin: 'a0000000-0000-4000-8000-000000000007',
  referrer: 'a0000000-0000-4000-8000-000000000008',
};
export function seedSql() {
  const i = ids;
  return `select set_config('request.jwt.claim.role','service_role',false);
insert into public.programs(id,name,slug,status,country_code,feature_flags) values
 ('${i.programA}','A','a','active','US','{"loyalitySingleBusiness":true}'),
 ('${i.programB}','B','b','active','US','{"loyalitySingleBusiness":true}');
insert into public.businesses(id,program_id,name,slug,reward_rate_percent) values
 ('${i.businessA}','${i.programA}','A','a',10),('${i.businessB}','${i.programB}','B','b',10);
insert into auth.users(id) values ${['owner','staff','member','memberB','admin','platformAdmin','referrer'].map(k => `('${i[k]}')`).join(',')};
insert into public.profiles(id,full_name,email,phone,role,business_id,referral_code,member_qr_token) values
 ${[['owner','business-owner'],['staff','business-staff'],['member','customer'],['memberB','customer'],['admin','customer'],['platformAdmin','platform-admin'],['referrer','customer']].map(([k,r]) => `('${i[k]}','${k}','${k}@example.test','123','${r}',${['owner','staff'].includes(k)?`'${i.businessA}'`:'null'},'${k.toUpperCase()}','qr-${k}')`).join(',')};
insert into public.program_memberships(program_id,profile_id,role,business_id) values
 ${[['owner','business-owner'],['staff','business-staff'],['member','member'],['memberB','member'],['admin','program-admin'],['referrer','member']].map(([k,r])=>`('${k==='memberB'?i.programB:i.programA}','${i[k]}','${r}',${['owner','staff'].includes(k)?`'${i.businessA}'`:'null'})`).join(',')};
insert into public.reward_balances(program_id,profile_id,points) values
 ('${i.programA}','${i.member}',1000),('${i.programB}','${i.memberB}',1000);
insert into public.loyality_business_settings(program_id,business_id,public_business_name) values
 ('${i.programA}','${i.businessA}','A'),('${i.programB}','${i.businessB}','B');
`;
}
