import { readFile } from 'node:fs/promises'
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
console.log(JSON.stringify({ passed: failures.length === 0, contracts: contracts.length, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
