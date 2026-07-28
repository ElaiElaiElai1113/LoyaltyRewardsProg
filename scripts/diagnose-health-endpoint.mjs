const input = process.argv[2]
if (!input) {
  console.error('Usage: node scripts/diagnose-health-endpoint.mjs https://rewards.example.com')
  process.exit(2)
}
const origin = new URL(input.startsWith('http') ? input : `https://${input}`).origin
const checks = []
try {
  const response = await fetch(`${origin}/api/health`, { redirect: 'manual', signal: AbortSignal.timeout(15000) })
  const contentType = response.headers.get('content-type') ?? ''
  const body = await response.text()
  const looksHtml = /^\s*<!doctype html|^\s*<html/i.test(body)
  let parsed = null
  if (contentType.includes('application/json')) {
    try { parsed = JSON.parse(body) } catch { parsed = null }
  }
  checks.push({ name: 'status', passed: response.ok, detail: response.status })
  checks.push({ name: 'json-content-type', passed: contentType.includes('application/json'), detail: contentType })
  checks.push({ name: 'not-spa-rewrite', passed: !looksHtml, detail: looksHtml ? 'API path rewrites to index.html' : 'API response is not HTML' })
  checks.push({ name: 'health-contract', passed: parsed?.ok === true, detail: parsed ?? body.slice(0, 160) })
} catch (error) {
  checks.push({ name: 'network', passed: false, detail: error instanceof Error ? error.message : String(error) })
}
const report = { origin, checkedAt: new Date().toISOString(), passed: checks.every((check) => check.passed), checks }
console.log(JSON.stringify(report, null, 2))
process.exitCode = report.passed ? 0 : 1
