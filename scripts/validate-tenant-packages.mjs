import { access, readFile } from 'node:fs/promises'

const expected = {
  guatemala: { programName: 'Guatemala Rewards', locale: 'es-GT', currency: 'GTQ', timezone: 'America/Guatemala' },
  synergize: { programName: 'Synergize', locale: 'en' },
  davao: { programName: 'Davao Rewards', locale: 'en-PH', currency: 'PHP', timezone: 'Asia/Manila' },
}
const blockers = []

for (const [slug, required] of Object.entries(expected)) {
  const root = `migration-packages/${slug}`
  await Promise.all([
    access(`${root}/source-export.json`),
    access(`${root}/SIGN-OFF.md`),
  ])
  const config = JSON.parse(await readFile(`${root}/tenant-config.json`, 'utf8'))
  for (const [key, value] of Object.entries(required)) {
    if (config[key] !== value) throw new Error(`${slug}: expected ${key}=${value}`)
  }
  for (const field of ['sourceSystem', 'currency', 'timezone', 'emailFromName', 'emailFromAddress']) {
    if (!config[field]) blockers.push(`${slug}.${field}`)
  }
  if (!config.primaryDomain) blockers.push(`${slug}.primaryDomain`)
  if (!config.legalDocumentsReceived) blockers.push(`${slug}.legalDocumentsReceived`)
  if (!config.brandingAssetsReceived) blockers.push(`${slug}.brandingAssetsReceived`)
}

console.log(JSON.stringify({ valid: true, packages: Object.keys(expected), externalBlockers: blockers }, null, 2))
