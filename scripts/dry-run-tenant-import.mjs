import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { digest, metrics, requiredCollections } from './tenant-export-metrics.mjs'

const [inputArg, outputArg] = process.argv.slice(2)
if (!inputArg) {
  console.error('Usage: npm run ops:tenant:dry-run -- export.json [output-directory]')
  process.exit(2)
}

const inputPath = resolve(inputArg)
const data = JSON.parse(await readFile(inputPath, 'utf8'))
const missing = requiredCollections.filter((key) => !Array.isArray(data[key]))
if (missing.length) throw new Error(`Invalid export; missing arrays: ${missing.join(', ')}`)

const outputDir = resolve(outputArg ?? `tenant-import-dry-run-${Date.now()}`)
await mkdir(outputDir, { recursive: true })
const batchId = digest(data).slice(0, 24)
const staged = Object.fromEntries(requiredCollections.map((key) => [
  key,
  data[key].map((row, index) => ({ ...row, _importBatchId: batchId, _sourceIndex: index })),
]))
const manifest = {
  mode: 'dry-run',
  batchId,
  createdAt: new Date().toISOString(),
  source: { path: inputPath, filename: basename(inputPath), sha256: digest(data) },
  metrics: metrics(data),
  activationRequired: true,
  rollback: {
    strategy: 'suspend-program-and-export-post-import-writes',
    importedRecords: Object.fromEntries(requiredCollections.map((key) => [key, staged[key].length])),
    destructiveDeleteAllowed: false,
  },
}
await writeFile(resolve(outputDir, 'staged-import.json'), `${JSON.stringify(staged, null, 2)}\n`)
await writeFile(resolve(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify({ ok: true, outputDir, manifest }, null, 2))
