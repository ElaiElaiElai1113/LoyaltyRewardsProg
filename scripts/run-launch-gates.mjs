import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const hosted = process.argv.includes('--hosted')
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run this command through npm so npm_execpath is available.')
const gates = [
  ['typecheck', ['run', 'typecheck']],
  ['lint', ['run', 'lint']],
  ['unit', ['run', 'test:unit']],
  ['legacy-regression', ['test']],
  ['tenant-tools', ['run', 'test:tenant-tools']],
  ['migration-contracts', ['run', 'test:migration-contracts']],
  ['branding', ['run', 'audit:tenant-branding']],
  ['email-readiness', ['run', 'test:email-readiness']],
  ['legal-readiness', ['run', 'test:legal-readiness']],
  ['mobile-readiness', ['run', 'test:mobile-readiness']],
  ['isolated-qa-tooling', ['run', 'test:local-qa-readiness']],
  ['build', ['run', 'build']],
  ['build-budget', ['run', 'build:budget']],
  ['playwright-ci', ['run', 'test:e2e:ci']],
  ['rewardme-release-mode', ['run', 'test:e2e:rewardme-release-mode']],
  ['tenant-console', ['run', 'test:tenant-console']],
  ['load', ['run', 'test:load']],
]
if (hosted) gates.push(['hosted-security', ['run', 'test:tenant-security']])

const results = []
for (const [name, args] of gates) {
  const started = Date.now()
  const result = spawnSync(process.execPath, [npmCli, ...args], {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 5 * 1024 * 1024,
  })
  results.push({
    name,
    passed: result.status === 0,
    exitCode: result.status,
    spawnError: result.error?.message ?? null,
    durationMs: Date.now() - started,
    outputTail: `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim().split(/\r?\n/).slice(-30),
  })
  if (result.status !== 0) break
}
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const report = {
  generatedAt: new Date().toISOString(),
  commit,
  hosted,
  passed: results.length === gates.length && results.every((result) => result.passed),
  results,
}
const canonical = JSON.stringify(report)
report.sha256 = createHash('sha256').update(canonical).digest('hex')
const directory = resolve('artifacts/launch-evidence')
await mkdir(directory, { recursive: true })
const output = resolve(directory, `launch-gates-${Date.now()}.json`)
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ passed: report.passed, output, sha256: report.sha256, gates: results.map(({ name, passed, durationMs }) => ({ name, passed, durationMs })) }, null, 2))
process.exit(report.passed ? 0 : 1)
