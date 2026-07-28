import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const release = JSON.parse(await readFile('ops/migration-release.json', 'utf8'))
const email = JSON.parse(await readFile('docs/tenant-email-redirect-matrix.json', 'utf8'))
const migrations = await Promise.all(release.migrations.map(async (entry) => {
  const content = await readFile(entry.file)
  return { ...entry, sha256: createHash('sha256').update(content).digest('hex'), status: 'pending-approval' }
}))
const report = {
  generatedAtUtc: new Date().toISOString(),
  projectRef: release.projectRef,
  branch: 'agent/four-brand-saas-foundation',
  hostedSchemaChanged: false,
  migrations,
  tenantPackages: ['guatemala', 'synergize', 'davao'],
  emailDomains: email.programs.map(({ slug, status, hostname }) => ({ slug, status, hostname })),
  validationCommands: [
    'npm run ops:migrations:validate',
    'npm run test:operations-readiness',
    'npm run test:e2e:ci',
    'npm run test:e2e:quality',
    'npm run test:tenant-console',
    'npm run test:load',
  ],
  externalBlockers: [
    'Supabase database password for read-only hosted preflight',
    'Exact approval before applying the three migrations',
    'Source exports and approved financial totals for the three tenant migrations',
    'Production deployment URL and GitHub operations secrets',
    'SMTP/DNS verification for pending tenant senders',
    'Disposable restore target',
    'App Store and Play Store signing identities',
  ],
}
await mkdir('artifacts/launch-readiness', { recursive: true })
const output = process.argv[2] ?? 'artifacts/launch-readiness/latest.json'
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
