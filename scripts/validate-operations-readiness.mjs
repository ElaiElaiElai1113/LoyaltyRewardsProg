import { readFile } from 'node:fs/promises'

const required = {
  '.github/workflows/operations.yml': [
    'schedule:',
    'ops:monitor',
    'supabase db dump',
    '--role-only',
    '--data-only',
    '--use-copy',
    'storage.buckets_vectors',
    'storage.vector_indexes',
    'scripts/validate-scheduled-backup.mjs',
    'BACKUP_ENCRYPTION_PASSPHRASE',
    'gpg --symmetric',
    '.tar.gz.gpg',
    'sha256sum -c',
    'retention-days: 14',
  ],
  '.github/workflows/post-deployment.yml': [
    'deployment_url',
    'ops:smoke',
    'ops:health:diagnose',
    'loyalty-rewards-prog.vercel.app',
    'www.medellinrewards.com',
    'guatemalarewards.com',
    'wondertown-rewards.vercel.app',
    'status=0',
    '|| status=1',
    'exit "$status"',
  ],
  '.github/workflows/tenant-deployment.yml': [
    'workflow_run:',
    'ENABLE_TENANT_DEPLOYMENT_SYNC',
    'VERCEL_TOKEN',
    'ops:deploy:tenants',
    'loyalty-rewards-prog.vercel.app',
    'www.medellinrewards.com',
    'guatemalarewards.com',
    'wondertown-rewards.vercel.app',
    '--expected-version "$EXPECTED_COMMIT_SHA"',
  ],
  'scripts/deploy-tenant-sites.mjs': [
    'githubCommitSha=',
    'REWARDS_SOURCE_COMMIT=',
    'guatemala-rewards',
    "['pinas-rewards.vercel.app', 'wondertown-rewards.vercel.app']",
    "runVercel(['alias', 'set'",
  ],
  'docs/tenant-deployment-automation.md': [
    'Tenant deployment synchronization',
    'VERCEL_TOKEN',
    'ENABLE_TENANT_DEPLOYMENT_SYNC',
    'Never use a different source commit for only one tenant',
  ],
  'docs/platform-administrator-guide.md': ['Program suspension', 'Migration approval', 'Incident response'],
  'docs/tenant-administrator-guide.md': ['Branding', 'Team access', 'Data export'],
  'docs/privacy-operations-runbook.md': ['Access export', 'Account deletion', 'Financial records'],
  'docs/incident-and-cutover-runbook.md': ['Rollback', 'Reconciliation', 'Domain cutover'],
}
const failures = []
for (const [file, needles] of Object.entries(required)) {
  const content = await readFile(file, 'utf8').catch(() => '')
  for (const needle of needles) if (!content.includes(needle)) failures.push(`${file}: missing ${needle}`)
}
console.log(JSON.stringify({ passed: failures.length === 0, failures }, null, 2))
process.exit(failures.length ? 1 : 0)
