import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const matrix = JSON.parse(await readFile('docs/tenant-email-redirect-matrix.json', 'utf8'))
const extraOrigins = (process.env.MONITOR_ORIGINS ?? '').split(',').map((value) => value.trim()).filter(Boolean)
const origins = [
  ...matrix.programs
    .filter((program) => program.status === 'ready' || program.monitor === true)
    .map((program) => `https://${program.publicHostname ?? program.hostname}`),
  ...extraOrigins,
]
const results = []

for (const origin of [...new Set(origins)]) {
  const started = Date.now()
  try {
    const [home, health] = await Promise.all([
      fetch(origin, { redirect: 'follow', signal: AbortSignal.timeout(15_000) }),
      fetch(`${origin}/api/health`, { redirect: 'follow', signal: AbortSignal.timeout(15_000) }),
    ])
    const healthType = health.headers.get('content-type') ?? ''
    const healthBody = healthType.includes('json') ? await health.json() : null
    results.push({
      origin,
      passed: home.ok && health.ok && healthType.includes('json') && healthBody?.status === 'ready',
      homeStatus: home.status,
      healthStatus: health.status,
      healthType,
      durationMs: Date.now() - started,
    })
  } catch (error) {
    results.push({ origin, passed: false, error: error instanceof Error ? error.message : String(error), durationMs: Date.now() - started })
  }
}

const report = { checkedAtUtc: new Date().toISOString(), passed: results.length > 0 && results.every((result) => result.passed), results }
const output = resolve(process.argv[2] ?? 'artifacts/monitoring/latest.json')
await mkdir(resolve(output, '..'), { recursive: true })
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
process.exit(report.passed ? 0 : 1)
