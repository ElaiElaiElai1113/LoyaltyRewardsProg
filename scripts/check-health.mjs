const target = process.argv[2] ?? process.env.HEALTHCHECK_URL

if (!target) {
  console.error('Usage: npm run ops:health -- https://deployment.example/api/health')
  process.exit(2)
}

const url = new URL('/api/health', target)
const controller = new AbortController()
const timeout = setTimeout(() => controller.abort(), 10_000)

try {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  })
  const body = await response.json().catch(() => ({}))
  console.log(JSON.stringify({ httpStatus: response.status, url: url.toString(), ...body }, null, 2))
  if (!response.ok || body.ok !== true) process.exitCode = 1
} catch (error) {
  console.error(`Health check failed: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
} finally {
  clearTimeout(timeout)
}
