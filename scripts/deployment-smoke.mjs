const target = process.argv[2] ?? process.env.DEPLOYMENT_URL

if (!target) {
  console.error('Usage: npm run ops:smoke -- https://deployment.example')
  process.exit(2)
}

const baseUrl = new URL(target)
const checks = [
  { path: '/api/health', json: true },
  { path: '/', json: false },
  { path: '/signin', json: false },
  { path: '/business', json: false },
  { path: '/guide', json: false },
]
const results = []

for (const check of checks) {
  const url = new URL(check.path, baseUrl)
  const startedAt = Date.now()
  try {
    const response = await fetch(url, {
      headers: { Accept: check.json ? 'application/json' : 'text/html' },
      redirect: 'follow',
      signal: AbortSignal.timeout(15_000),
    })
    const contentType = response.headers.get('content-type') ?? ''
    const body = check.json ? await response.json().catch(() => null) : await response.text()
    const validBody = check.json ? body?.ok === true : contentType.includes('text/html') && body.includes('<div id="root">')
    results.push({ path: check.path, ok: response.ok && validBody, status: response.status, latencyMs: Date.now() - startedAt })
  } catch (error) {
    results.push({ path: check.path, ok: false, error: error instanceof Error ? error.message : String(error), latencyMs: Date.now() - startedAt })
  }
}

console.log(JSON.stringify({ target: baseUrl.toString(), ok: results.every((result) => result.ok), results }, null, 2))
if (results.some((result) => !result.ok)) process.exitCode = 1
