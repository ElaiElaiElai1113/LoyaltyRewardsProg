import { readFile } from 'node:fs/promises'

const files = {
  migration: 'supabase/migrations/20260812062827_rewardme_manual_membership_operations.sql',
  memberPage: 'src/features/membership/pages/rewardme-membership-page.tsx',
  adminPage: 'src/features/platform/pages/membership-operations-page.tsx',
  service: 'src/integrations/supabase/services/manual-membership-service.ts',
  router: 'src/routes/router.tsx',
  layout: 'src/layouts/admin-layout.tsx',
  email: 'api/_tenant-email-templates.ts',
  sop: 'docs/rewardme-membership-operations-sop.md',
  partnerGuide: 'docs/rewardme-partner-onboarding-guide.md',
  workflow: '.github/workflows/rewardme-manual-membership.yml',
  rollback: 'supabase/rollback-guides/20260812062827_safe_disable.sql',
}

const source = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([key, path]) => [key, await readFile(path, 'utf8')])))
const failures = []
const requireText = (file, value, reason) => {
  if (!source[file].includes(value)) failures.push(`${files[file]}: ${reason}`)
}

for (const functionName of [
  'request_manual_membership',
  'request_manual_membership_cancellation',
  'cancel_manual_membership_request',
  'review_manual_membership_request',
  'renew_manual_membership',
  'cancel_manual_membership',
  'get_manual_membership_requests',
]) requireText('migration', `function public.${functionName}`, `missing ${functionName}`)

for (const control of [
  'enable row level security',
  'security definer',
  "set search_path = ''",
  'revoke insert, update, delete on table public.memberships',
  'manual_membership_requests_one_pending_idx',
  'manual_membership_requests_reviewer_idx',
  'manual_membership_events_profile_idx',
  'manual_membership_events_actor_idx',
  'enforce_rewardme_manual_membership_mutation',
  "auth.jwt() ->> 'role'",
  "'membership_canceled'",
  "'{\"savingsPlans\":false}'",
  "to_regclass('public.savings_goals')",
]) requireText('migration', control, `missing security or audit control: ${control}`)

for (const marker of ['data-membership-request-panel', 'Review pending', 'Status history', 'Retry', 'Cancel pending request']) {
  requireText('memberPage', marker, `missing member recovery/status control: ${marker}`)
}
for (const marker of ['data-membership-operations', 'Request queue', 'Recent audit history', 'Approve', 'Decline', 'Renew', 'Cancel']) {
  requireText('adminPage', marker, `missing staff operations control: ${marker}`)
}
requireText('router', "path: '/admin/memberships'", 'protected membership operations route is missing')
requireText('layout', "to: '/admin/memberships'", 'membership operations navigation is missing')
requireText('email', "'membership-request-received'", 'request email template is missing')
requireText('email', "'membership-status-update'", 'status email template is missing')
requireText('sop', 'Refunds and fee disputes', 'refund procedure is missing')
requireText('sop', 'RewardMe does not collect online payments or card details', 'payment boundary is missing')
requireText('partnerGuide', 'Admin review and activation controls', 'partner admin review procedure is missing')
requireText('workflow', "MIGRATION_VERSION: '20260812062827'", 'production migration workflow is missing')
requireText('workflow', 'stripe_memberships_require_manual_reconciliation', 'production provider preflight is missing')
requireText('workflow', 'manual_membership_operations_verification_failed', 'production verification is missing')
requireText('rollback', 'revoke execute on function public.request_manual_membership', 'safe-disable procedure is missing')

if (/mockSubscribe|mockRenew|mockCancel/.test(source.memberPage)) {
  failures.push(`${files.memberPage}: RewardMe must not call demo membership mutations`)
}
if (/Medellin|PinasRewards|Pinas Rewards/i.test([
  source.memberPage,
  source.adminPage,
  source.service,
  source.email,
  source.sop,
  source.partnerGuide,
].join('\n'))) {
  failures.push('RewardMe membership operations files contain legacy branding')
}

console.log(JSON.stringify({ passed: failures.length === 0, checks: 41, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
