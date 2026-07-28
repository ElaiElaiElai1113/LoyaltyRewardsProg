import { resolve4, resolve6 } from 'node:dns/promises'

const [hostnameArg] = process.argv.slice(2)
const hostname = String(hostnameArg ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
if (!hostname) {
  console.error('Usage: npm run ops:domain:check -- rewards.example.com')
  process.exit(2)
}

const checks = []
async function check(name, operation) {
  try {
    const detail = await operation()
    checks.push({ name, passed: true, detail })
  } catch (error) {
    checks.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) })
  }
}

await check('dns', async () => {
  const [ipv4, ipv6] = await Promise.all([resolve4(hostname).catch(() => []), resolve6(hostname).catch(() => [])])
  if (!ipv4.length && !ipv6.length) throw new Error('No A or AAAA records resolve')
  return { ipv4, ipv6 }
})
await check('https', async () => {
  const response = await fetch(`https://${hostname}/`, { redirect: 'follow', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return { status: response.status, finalUrl: response.url }
})
await check('tenant-metadata', async () => {
  const response = await fetch(`https://${hostname}/`, { signal: AbortSignal.timeout(15000) })
  const html = await response.text()
  const missing = ['<title', 'rel="icon"', 'rel="manifest"'].filter((token) => !html.includes(token))
  if (missing.length) throw new Error(`Missing HTML metadata: ${missing.join(', ')}`)
  return 'title, favicon, and manifest references found'
})
await check('manifest', async () => {
  const response = await fetch(`https://${hostname}/site.webmanifest`, { signal: AbortSignal.timeout(15000) })
  const manifest = await response.json()
  if (!manifest.name || !Array.isArray(manifest.icons)) throw new Error('Manifest lacks name or icons')
  return { name: manifest.name, icons: manifest.icons.length }
})
await check('health', async () => {
  const response = await fetch(`https://${hostname}/api/health`, { signal: AbortSignal.timeout(15000) })
  const body = await response.json()
  if (!response.ok || body.ok !== true) throw new Error(`Health check failed with HTTP ${response.status}`)
  return body
})

const report = { hostname, checkedAt: new Date().toISOString(), passed: checks.every((item) => item.passed), checks }
console.log(JSON.stringify(report, null, 2))
process.exit(report.passed ? 0 : 1)
