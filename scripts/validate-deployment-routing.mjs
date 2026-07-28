import { readFile } from 'node:fs/promises'

const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const fallback = config.rewrites?.find((rewrite) => rewrite.destination === '/index.html')
const checks = [
  { name: 'single-spa-fallback', passed: config.rewrites?.filter((rewrite) => rewrite.destination === '/index.html').length === 1 },
  { name: 'api-excluded-from-fallback', passed: Boolean(fallback?.source?.includes('?!api(?:/|$)')) },
  { name: 'high-level-routing-only', passed: !config.routes },
  { name: 'health-function-present', passed: await readFile('api/health.ts', 'utf8').then((text) => text.includes("status: 'ready'")).catch(() => false) },
]
console.log(JSON.stringify({ passed: checks.every((check) => check.passed), checks }, null, 2))
process.exit(checks.every((check) => check.passed) ? 0 : 1)
