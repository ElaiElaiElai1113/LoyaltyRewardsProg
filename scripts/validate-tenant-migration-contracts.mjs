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
]

const failures = []
for (const contract of contracts) {
  const sql = await readFile(resolve(contract.file), 'utf8')
  for (const pattern of contract.required) {
    pattern.lastIndex = 0
    if (!pattern.test(sql)) failures.push({ file: contract.file, missing: pattern.source })
  }
  if (/security definer(?![\s\S]{0,80}set search_path)/i.test(sql)) {
    failures.push({ file: contract.file, missing: 'every security definer function must pin search_path' })
  }
}
console.log(JSON.stringify({ passed: failures.length === 0, contracts: contracts.length, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
