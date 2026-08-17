import { readFile, readdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const contracts = [
  {
    file: 'supabase/migrations/20260728000000_tenant_limits_and_storage_isolation.sql',
    required: [
      /security definer[\s\S]*set search_path = public/i,
      /enforce_custom_domain_limit/,
      /enforce_business_limit/,
      /enforce_member_limit/,
      /storage\.foldername\(name\)\)\[2\]\)::uuid/,
      /revoke all on function public\.get_program_entitlements_internal/,
    ],
  },
  {
    file: 'supabase/migrations/20260729000000_program_state_usage_and_audit.sql',
    required: [
      /resolve_program_host_state/,
      /resolve_program_email_brand/,
      /d\.verification_status = 'verified'/,
      /p\.status = 'active'/,
      /if not public\.is_platform_admin\(\)/,
      /revoke all on function public\.set_program_status/,
    ],
  },
  {
    file: 'supabase/migrations/20260730000000_domain_team_and_import_operations.sql',
    required: [
      /enable row level security/,
      /program admins read import batches/,
      /program_admin_required/g,
      /last_program_admin/,
      /idempotency_payload_mismatch/,
      /unique \(program_id, idempotency_key\)/,
      /security definer set search_path = public/g,
    ],
  },
  {
    file: 'supabase/migrations/20260801050000_harden_tenant_business_and_commerce_flows.sql',
    required: [
      /has_active_business_program_access/,
      /pm\.program_id = b\.program_id/,
      /pm\.business_id = b\.id/,
      /pm\.profile_id = auth\.uid\(\)/,
      /pm\.status = 'active'/,
      /insert into public\.orders \(\s*program_id/,
      /insert into public\.order_line_items \(\s*program_id/,
      /on conflict \(program_id, profile_id\) do nothing/g,
      /insert into public\.redemptions \(\s*program_id/,
      /create or replace function public\.create_owner_product/,
      /create or replace function public\.create_owner_promotion/,
      /create or replace function public\.create_owner_gift_card_catalog_item/,
      /revoke all on function public\.credit_partner_referral/,
    ],
    forbidden: [
      /on conflict \(profile_id\)/,
    ],
  },
  {
    file: 'supabase/migrations/20260801060000_harden_public_referral_and_auth_flows.sql',
    required: [
      /authorize_early_access_welcome_email/,
      /welcome_email_delivery_attempts/,
      /welcome_email_rate_limited/,
      /d\.verification_status = 'verified'/,
      /create or replace function public\.get_member_by_qr_token/,
      /pm\.program_id = v_business\.program_id/,
      /revoke all on function public\.get_public_gift_card_by_token\(text\)/,
      /gc\.program_id = p_program_id/,
      /pr\.primary_color/,
      /pr\.accent_color/,
      /alter table public\.referrals[\s\S]*add column if not exists program_id/,
      /insert into public\.referrals \(\s*program_id/,
      /on conflict \(program_id, profile_id\) do nothing/,
      /cr\.program_id = v_business\.program_id/,
      /insert into public\.partner_referrals \(\s*program_id/,
      /revoke all on function public\.consume_reward_credit\(uuid\)/,
    ],
    forbidden: [
      /on conflict \(profile_id\)/,
      /'#f4a84f'::text/,
      /'#7bd8cf'::text/,
    ],
  },
  {
    file: 'supabase/migrations/20260817120452_idempotent_gift_card_redemption.sql',
    required: [
      /rename to record_member_transaction_once/,
      /alter function public\.record_member_transaction_once[\s\S]*set search_path = ''/,
      /revoke all on function public\.record_member_transaction_once[\s\S]*from public, anon, authenticated, service_role/,
      /member_transaction\.profile_id = member_profile\.id/,
      /member_transaction\.purchase_amount = purchase_amount_value/,
      /lower\(trim\(member_transaction\.receipt_number\)\) = lower\(receipt_number_value\)/,
      /member_transaction\.note is not distinct from note_value/,
      /rename to redeem_gift_card_once/,
      /alter function public\.redeem_gift_card_once[\s\S]*set search_path = ''/,
      /revoke all on function public\.redeem_gift_card_once[\s\S]*from public, anon, authenticated, service_role/,
      /event\.metadata ->> 'client_request_id' = p_client_request_id::text/,
      /'client_request_id', p_client_request_id::text/,
      /pg_catalog\.pg_advisory_xact_lock/,
      /pg_catalog\.hashtextextended/,
      /select transaction_row\.\*[\s\S]{0,120}into result_transaction[\s\S]{0,120}from public\.record_member_transaction_once\(/,
      /select card_row\.\*[\s\S]{0,120}into result_card[\s\S]{0,120}from public\.redeem_gift_card_once\(/,
      /requested_gift_card_amount_value numeric\(12,2\)/,
      /jsonb_typeof\(event\.metadata -> 'requested_gift_card_amount'\) = 'null'/,
      /'requested_gift_card_amount', coalesce\(/,
      /to_jsonb\(requested_gift_card_amount_value\)/,
      /This request was already used for a different transaction/,
      /security definer[\s\S]{0,80}set search_path = ''/,
      /grant execute on function public\.record_member_transaction[\s\S]*to authenticated/,
      /grant execute on function public\.redeem_gift_card[\s\S]*to authenticated/,
    ],
    forbidden: [
      /p_gift_card_amount is null\s+or/,
      /when others then/,
      /select\s+public\.record_member_transaction_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_transaction/,
      /select\s+public\.redeem_gift_card_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_card/,
    ],
  },
  {
    file: 'supabase/migrations/20260817121855_strict_reward_redemption_idempotency.sql',
    required: [
      /rename to redeem_reward_once/,
      /alter function public\.redeem_reward_once[\s\S]*set search_path = ''/,
      /revoke all on function public\.redeem_reward_once[\s\S]*from public, anon, authenticated, service_role/,
      /normalized_pickup_window text := trim\(coalesce\(p_pickup_window, ''\)\)/,
      /normalized_notes text := nullif\(trim\(coalesce\(p_notes, ''\)\), ''\)/,
      /pg_catalog\.pg_advisory_xact_lock/,
      /select redemption_row\.\*[\s\S]{0,120}into result_redemption[\s\S]{0,120}from public\.redeem_reward_once\(/,
      /result_redemption\.reward_id <> p_reward_id/,
      /trim\(result_redemption\.pickup_window\) <> normalized_pickup_window/,
      /result_redemption\.notes[\s\S]*is distinct from normalized_notes/,
      /This request was already used for a different reward redemption/,
      /security definer[\s\S]{0,80}set search_path = ''/,
      /grant execute on function public\.redeem_reward[\s\S]*to authenticated/,
    ],
    forbidden: [
      /if found then[\s\S]{0,500}return result_redemption/,
      /select\s+public\.redeem_reward_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_redemption/,
    ],
  },
  {
    file: 'supabase/migrations/20260817123500_drop_legacy_anonymous_gift_card_redeemer.sql',
    required: [
      /drop function if exists public\.redeem_gift_card\(uuid, uuid, uuid\)/,
      /notify pgrst, 'reload schema'/,
    ],
  },
  {
    file: 'supabase/migrations/20260817125922_fix_idempotency_actor_id_ambiguity.sql',
    required: [
      /create or replace function public\.record_member_transaction_once\(/,
      /create or replace function public\.record_member_transaction\(/,
      /create or replace function public\.redeem_gift_card_once\(/,
      /create or replace function public\.redeem_gift_card\(/,
      /create or replace function public\.redeem_reward_once\(/,
      /create or replace function public\.redeem_reward\(/,
      /v_actor_id uuid := auth\.uid\(\)/,
      /event\.actor_id = v_actor_id/,
      /recorded_by = v_actor_id/,
      /profile_id = v_actor_id/,
      /select transaction_row\.\*[\s\S]{0,120}into result_transaction[\s\S]{0,120}from public\.record_member_transaction_once\(/,
      /select card_row\.\*[\s\S]{0,120}into result_card[\s\S]{0,120}from public\.redeem_gift_card_once\(/,
      /select redemption_row\.\*[\s\S]{0,120}into result_redemption[\s\S]{0,120}from public\.redeem_reward_once\(/,
      /revoke all on function public\.record_member_transaction_once[\s\S]*from public, anon, authenticated, service_role/,
      /revoke all on function public\.redeem_gift_card_once[\s\S]*from public, anon, authenticated, service_role/,
      /revoke all on function public\.redeem_reward_once[\s\S]*from public, anon, authenticated, service_role/,
      /grant execute on function public\.record_member_transaction[\s\S]*to authenticated/,
      /grant execute on function public\.redeem_gift_card[\s\S]*to authenticated/,
      /grant execute on function public\.redeem_reward[\s\S]*to authenticated/,
      /notify pgrst, 'reload schema'/,
    ],
    forbidden: [
      /\bactor_id uuid := auth\.uid\(\)/,
      /event\.actor_id = actor_id/,
      /recorded_by = actor_id/,
      /profile_id = actor_id/,
      /plpgsql\.variable_conflict/,
      /select\s+public\.record_member_transaction_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_transaction/,
      /select\s+public\.redeem_gift_card_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_card/,
      /select\s+public\.redeem_reward_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_redemption/,
    ],
  },
  {
    file: 'supabase/migrations/20260817152354_fix_composite_rpc_wrapper_assignment.sql',
    required: [
      /create or replace function public\.record_member_transaction\(/,
      /create or replace function public\.redeem_gift_card\(/,
      /create or replace function public\.redeem_reward\(/,
      /select transaction_row\.\*[\s\S]{0,120}into result_transaction[\s\S]{0,120}from public\.record_member_transaction_once\(/,
      /select card_row\.\*[\s\S]{0,120}into result_card[\s\S]{0,120}from public\.redeem_gift_card_once\(/,
      /select redemption_row\.\*[\s\S]{0,120}into result_redemption[\s\S]{0,120}from public\.redeem_reward_once\(/,
      /create or replace function public\.record_member_transaction\([\s\S]*?security definer\s+set search_path = ''/,
      /create or replace function public\.redeem_gift_card\([\s\S]*?security definer\s+set search_path = ''/,
      /create or replace function public\.redeem_reward\([\s\S]*?security definer\s+set search_path = ''/,
      /pg_catalog\.pg_advisory_xact_lock/g,
      /revoke all on function public\.record_member_transaction[\s\S]*from public, anon, service_role/,
      /revoke all on function public\.redeem_gift_card[\s\S]*from public, anon, service_role/,
      /revoke all on function public\.redeem_reward[\s\S]*from public, anon, service_role/,
      /grant execute on function public\.record_member_transaction[\s\S]*to authenticated/,
      /grant execute on function public\.redeem_gift_card[\s\S]*to authenticated/,
      /grant execute on function public\.redeem_reward[\s\S]*to authenticated/,
      /notify pgrst, 'reload schema'/,
    ],
    forbidden: [
      /create or replace function public\.(?:record_member_transaction_once|redeem_gift_card_once|redeem_reward_once)\(/,
      /select\s+public\.record_member_transaction_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_transaction/,
      /select\s+public\.redeem_gift_card_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_card/,
      /select\s+public\.redeem_reward_once\s*\([\s\S]{0,1200}?\)\s+into\s+result_redemption/,
    ],
  },
  {
    file: 'supabase/migrations/20260817235443_atomic_tenant_reward_fulfillment.sql',
    required: [
      /create or replace function public\.fulfill_redemption\(\s*p_redemption_id uuid\s*\)/,
      /returns jsonb[\s\S]{0,100}security definer\s+set search_path = ''/,
      /v_actor_id uuid := auth\.uid\(\)/,
      /reward_row\.program_id = redemption_row\.program_id/,
      /business_row\.program_id = redemption_row\.program_id/,
      /where redemption_row\.id = p_redemption_id\s+for update of redemption_row/,
      /membership\.program_id = v_target\.program_id/,
      /membership\.business_id = v_target\.business_id/,
      /membership\.profile_id = v_actor_id/,
      /membership\.role in \('business-owner', 'business-staff'\)/,
      /membership\.status = 'active'/,
      /private\.has_required_agreements\(v_actor_id\) is not true/,
      /redemption_row\.program_id = v_target\.program_id/,
      /redemption_row\.reward_id = v_target\.reward_id/,
      /redemption_row\.status = 'ready'/,
      /insert into public\.admin_logs \(\s*program_id,\s*actor_id,\s*actor_name,\s*action,\s*details/,
      /values \(\s*v_target\.program_id,\s*v_actor_id/,
      /returning id into v_admin_log_id/,
      /revoke all on function public\.fulfill_redemption\(uuid\)[\s\S]*from public, anon, authenticated, service_role/,
      /grant execute on function public\.fulfill_redemption\(uuid\)[\s\S]*to authenticated/,
      /notify pgrst, 'reload schema'/,
    ],
    forbidden: [
      /set search_path = public/,
      /grant execute on function public\.fulfill_redemption\(uuid\)[\s\S]*to (?:public|anon|service_role)/,
      /insert into public\.admin_logs \(\s*actor_id/,
    ],
  },
]

const failures = []
for (const contract of contracts) {
  const sql = await readFile(resolve(contract.file), 'utf8')
  for (const pattern of contract.required) {
    pattern.lastIndex = 0
    if (!pattern.test(sql)) failures.push({ file: contract.file, missing: pattern.source })
  }
  for (const pattern of contract.forbidden ?? []) {
    pattern.lastIndex = 0
    if (pattern.test(sql)) failures.push({ file: contract.file, forbidden: pattern.source })
  }
  if (/security definer(?![\s\S]{0,80}set search_path)/i.test(sql)) {
    failures.push({ file: contract.file, missing: 'every security definer function must pin search_path' })
  }
}

const compositeFunctionNames = [
  'record_member_transaction_once',
  'redeem_gift_card_once',
  'redeem_reward_once',
]
const bareCompositeSelectInto = new RegExp(
  `\\bselect\\s+public\\.(${compositeFunctionNames.join('|')})\\s*\\([\\s\\S]{0,1200}?\\)\\s+into\\s+`
    + '(result_transaction|result_card|result_redemption)\\s*;',
  'gi',
)
const migrationDirectory = resolve('supabase/migrations')
for (const migrationName of await readdir(migrationDirectory)) {
  if (!migrationName.endsWith('.sql')) continue
  const file = `supabase/migrations/${migrationName}`
  const sql = await readFile(resolve(file), 'utf8')
  for (const match of sql.matchAll(bareCompositeSelectInto)) {
    failures.push({
      file,
      forbidden: `bare scalar composite SELECT INTO for public.${match[1]}`,
    })
  }
}
console.log(JSON.stringify({ passed: failures.length === 0, contracts: contracts.length, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
