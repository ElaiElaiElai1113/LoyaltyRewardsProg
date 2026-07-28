import { access, readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const [backupArg, manifestArg, outputArg] = process.argv.slice(2)
if (!backupArg || !manifestArg) {
  console.error('Usage: npm run ops:restore:rehearse -- backup.dump backup.manifest.json [report.json]')
  process.exit(2)
}
const backupPath = resolve(backupArg)
const manifestPath = resolve(manifestArg)
await Promise.all([access(backupPath), access(manifestPath)])
const [backup, manifest] = await Promise.all([stat(backupPath), readFile(manifestPath, 'utf8').then(JSON.parse)])
const checks = [
  { name: 'backup-nonempty', passed: backup.size > 0, detail: `${backup.size} bytes` },
  { name: 'manifest-readable', passed: Boolean(manifest), detail: manifestPath },
  { name: 'target-is-disposable', passed: process.env.RESTORE_TARGET_DISPOSABLE === 'true', detail: 'Set RESTORE_TARGET_DISPOSABLE=true only for an isolated target' },
  { name: 'target-url-present', passed: Boolean(process.env.RESTORE_DATABASE_URL), detail: process.env.RESTORE_DATABASE_URL ? 'configured' : 'not configured' },
]
const report = {
  mode: 'restore-rehearsal-preflight',
  generatedAt: new Date().toISOString(),
  executable: checks.every((check) => check.passed),
  backup: backupPath,
  manifest,
  checks,
  restoreCommandIntentionallyNotExecuted: true,
}
const output = resolve(outputArg ?? `restore-rehearsal-${Date.now()}.json`)
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ ...report, reportPath: output }, null, 2))
process.exit(report.executable ? 0 : 1)
