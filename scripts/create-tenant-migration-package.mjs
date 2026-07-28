import { cp, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [slugArg, outputArg] = process.argv.slice(2)
const slug = String(slugArg ?? '').trim().toLowerCase()
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Usage: npm run ops:tenant:package -- tenant-slug [output-directory]')
  process.exit(2)
}

const outputDir = resolve(outputArg ?? `migration-packages/${slug}`)
await mkdir(resolve(outputDir, 'reports'), { recursive: true })
await cp(resolve('docs/tenant-import-template.json'), resolve(outputDir, 'source-export.json'), { force: false }).catch(() => {})
const config = {
  slug, programName: '', sourceSystem: '', locale: '', currency: '', timezone: '',
  primaryDomain: '', emailFromName: '', emailFromAddress: '',
  mapCenter: { latitude: null, longitude: null },
  legalDocumentsReceived: false, brandingAssetsReceived: false,
}
const checklist = `# ${slug} Migration Sign-Off

## Inputs
- [ ] Source export received and frozen
- [ ] Branding, legal copy, email identity, domain access, and business rules received
- [ ] Source counts and financial totals approved

## Validation
- [ ] Import validation passes
- [ ] Dry-run manifest reviewed
- [ ] Destination program remains draft
- [ ] Reconciliation report has no differences
- [ ] Member, business, admin, agreement, reward, referral, and gift-card tests pass

## Cutover
- [ ] Parallel run completed
- [ ] DNS TTL lowered
- [ ] TLS, redirects, metadata, PWA, and email links verified
- [ ] Final reconciliation approved
- [ ] Rollback owner and decision window recorded
`
await writeFile(resolve(outputDir, 'tenant-config.json'), `${JSON.stringify(config, null, 2)}\n`)
await writeFile(resolve(outputDir, 'SIGN-OFF.md'), checklist)
console.log(JSON.stringify({ ok: true, outputDir }, null, 2))
