import { lookup, resolve4, resolve6 } from 'node:dns/promises'

const rawArgs = process.argv.slice(2)
const expectedVersionIndex = rawArgs.indexOf('--expected-version')
const expectedVersionArg = expectedVersionIndex >= 0 ? rawArgs[expectedVersionIndex + 1] : ''
if (expectedVersionIndex >= 0) {
  if (!expectedVersionArg || expectedVersionArg.startsWith('--')) {
    console.error('--expected-version requires a Git commit SHA.')
    process.exit(2)
  }
  rawArgs.splice(expectedVersionIndex, 2)
}

const [hostnameArg, ...expectedTenantNameParts] = rawArgs
const hostname = String(hostnameArg ?? '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
const expectedTenantName = expectedTenantNameParts.join(' ').trim()
const expectedVersion = String(expectedVersionArg).trim().toLowerCase()
if (!hostname) {
  console.error('Usage: npm run ops:domain:check -- rewards.example.com ["Tenant Rewards"] [--expected-version <git-sha>]')
  process.exit(2)
}
if (expectedVersion && !/^[a-f0-9]{7,40}$/.test(expectedVersion)) {
  console.error('--expected-version must be a 7 to 40 character Git commit SHA.')
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

async function readRenderedTenantMetadata(origin, expectedName) {
  let browser
  try {
    const { chromium } = await import('playwright')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()
    const runtimeErrors = []
    page.on('pageerror', (error) => runtimeErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') runtimeErrors.push(message.text())
    })
    page.on('requestfailed', (request) => {
      runtimeErrors.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText ?? 'request failed'}`)
    })

    const response = await page.goto(origin, { waitUntil: 'networkidle', timeout: 30_000 })
    if (!response?.ok()) throw new Error(`Rendered homepage returned HTTP ${response?.status() ?? 'unknown'}`)

    await page.waitForFunction((name) => {
      const content = (selector) => document.querySelector(selector)?.getAttribute('content')?.trim() ?? ''
      return document.title.trim() === name
        && content('meta[property="og:title"]') === name
        && content('meta[property="og:site_name"]') === name
        && content('meta[name="apple-mobile-web-app-title"]') === name
        && content('meta[name="description"]').startsWith(`${name} `)
    }, expectedName, { timeout: 15_000 })

    await page.waitForFunction(async (name) => {
      const manifestLink = document.querySelector('link[rel="manifest"]')?.getAttribute('href')
      if (!manifestLink) return false
      try {
        const manifest = manifestLink.startsWith('data:')
          ? JSON.parse(decodeURIComponent(manifestLink.slice(manifestLink.indexOf(',') + 1)))
          : await fetch(manifestLink).then((result) => result.json())
        return manifest.name === name
          && manifest.short_name === name
          && Array.isArray(manifest.icons)
          && manifest.icons.length > 0
      } catch {
        return false
      }
    }, expectedName, { timeout: 15_000 })

    const metadata = await page.evaluate(async () => {
      const content = (selector) => document.querySelector(selector)?.getAttribute('content')?.trim() ?? null
      const manifestLink = document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? ''
      const manifest = manifestLink.startsWith('data:')
        ? JSON.parse(decodeURIComponent(manifestLink.slice(manifestLink.indexOf(',') + 1)))
        : await fetch(manifestLink).then((result) => result.json())
      return {
        title: document.title.trim(),
        openGraphTitle: content('meta[property="og:title"]'),
        openGraphSiteName: content('meta[property="og:site_name"]'),
        appleTitle: content('meta[name="apple-mobile-web-app-title"]'),
        description: content('meta[name="description"]'),
        manifestName: manifest.name ?? null,
        manifestShortName: manifest.short_name ?? null,
        manifestIcons: Array.isArray(manifest.icons) ? manifest.icons.length : 0,
      }
    })

    if (runtimeErrors.length) throw new Error(`Runtime errors while reading tenant metadata: ${runtimeErrors.join(' | ')}`)
    return metadata
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (/executable doesn't exist|browserType\.launch/i.test(message)) {
      throw new Error(`${message} Run "npx playwright install chromium" before the domain check.`)
    }
    throw error
  } finally {
    await browser?.close()
  }
}

await check('dns', async () => {
  const [ipv4, ipv6] = await Promise.all([resolve4(hostname).catch(() => []), resolve6(hostname).catch(() => [])])
  if (ipv4.length || ipv6.length) return { ipv4, ipv6, resolver: 'dns' }

  const addresses = await lookup(hostname, { all: true }).catch(() => [])
  if (!addresses.length) throw new Error('No A or AAAA records resolve')
  return {
    ipv4: addresses.filter((entry) => entry.family === 4).map((entry) => entry.address),
    ipv6: addresses.filter((entry) => entry.family === 6).map((entry) => entry.address),
    resolver: 'system',
  }
})
await check('https', async () => {
  const response = await fetch(`https://${hostname}/`, { redirect: 'follow', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return { status: response.status, finalUrl: response.url }
})
await check('tenant-metadata', async () => {
  const response = await fetch(`https://${hostname}/`, { signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const html = await response.text()
  const missing = ['<title', 'rel="icon"', 'rel="manifest"'].filter((token) => !html.includes(token))
  if (missing.length) throw new Error(`Missing HTML metadata: ${missing.join(', ')}`)
  return 'title, favicon, and manifest references found'
})
if (expectedTenantName) {
  await check('tenant-brand', () => readRenderedTenantMetadata(`https://${hostname}/`, expectedTenantName))
} else {
  await check('manifest', async () => {
    const response = await fetch(`https://${hostname}/site.webmanifest`, { signal: AbortSignal.timeout(15000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const manifest = await response.json()
    if (!manifest.name || !Array.isArray(manifest.icons)) throw new Error('Manifest lacks name or icons')
    return { name: manifest.name, icons: manifest.icons.length }
  })
}
await check('health', async () => {
  const response = await fetch(`https://${hostname}/api/health`, { signal: AbortSignal.timeout(15000) })
  const body = await response.json()
  if (!response.ok || body.ok !== true) throw new Error(`Health check failed with HTTP ${response.status}`)
  if (expectedVersion) {
    const actualVersion = String(body.version ?? '').trim().toLowerCase()
    if (!actualVersion || (!expectedVersion.startsWith(actualVersion) && !actualVersion.startsWith(expectedVersion))) {
      throw new Error(`Expected deployed version ${expectedVersion.slice(0, 12)}, received ${actualVersion || 'missing'}`)
    }
  }
  return body
})

const report = {
  hostname,
  expectedTenantName: expectedTenantName || null,
  expectedVersion: expectedVersion || null,
  checkedAt: new Date().toISOString(),
  passed: checks.every((item) => item.passed),
  checks,
}
console.log(JSON.stringify(report, null, 2))
process.exit(report.passed ? 0 : 1)
