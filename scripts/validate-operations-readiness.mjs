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
    'pinas-rewards.vercel.app',
    'www.medellinrewards.com',
    'guatemalarewards.com',
    'wondertown-rewards.vercel.app',
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
