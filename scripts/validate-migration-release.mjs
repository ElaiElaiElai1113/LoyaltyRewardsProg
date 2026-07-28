import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const release = JSON.parse(await readFile('ops/migration-release.json', 'utf8'))
const timestamps = []
const evidence = []

if (!/^[a-z]{20}$/.test(release.projectRef) || release.approvalRequired !== true) {
  throw new Error('Migration release must identify the linked project and require approval.')
}

for (const entry of release.migrations) {
  const match = entry.file.match(/\/(\d{14})_[a-z0-9_]+\.sql$/)
  if (!match) throw new Error(`Invalid migration path: ${entry.file}`)
  const [migration, rollback] = await Promise.all([readFile(entry.file), readFile(entry.rollbackGuide)])
  if (!rollback.toString().includes('Manual emergency containment')) {
    throw new Error(`Rollback guide is not marked as manual emergency containment: ${entry.rollbackGuide}`)
  }
  timestamps.push(match[1])
  evidence.push({
    file: entry.file,
    sha256: createHash('sha256').update(migration).digest('hex'),
    rollbackGuide: entry.rollbackGuide,
  })
}

if (timestamps.some((value, index) => index > 0 && value <= timestamps[index - 1])) {
  throw new Error('Migrations are not in strict chronological order.')
}

console.log(JSON.stringify({ projectRef: release.projectRef, approvalRequired: true, migrations: evidence }, null, 2))
