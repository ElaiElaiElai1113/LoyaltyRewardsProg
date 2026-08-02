import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

if (existsSync('.env')) {
  for (const rawLine of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const separator = line.indexOf('=')
    if (separator < 1) continue
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim().replace(/^"|"$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const required = [
  'E2E_BASE_URL',
  'E2E_PASSWORD',
  'E2E_TENANT_NAME',
  'E2E_TENANT_CUSTOMER_EMAIL',
  'E2E_TENANT_BUSINESS_OWNER_EMAIL',
]
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  console.error(`Missing required tenant smoke variables: ${missing.join(', ')}`)
  process.exit(2)
}

const child = spawn(process.execPath, [
  playwrightCli,
  'test',
  'tests/e2e/tenant-authenticated-smoke.spec.ts',
  '--config=playwright.local.config.ts',
  '--workers=1',
], {
  cwd: repoRoot,
  env: { ...process.env, E2E_INCLUDE_TENANT_AUTH_SMOKE: 'true' },
  stdio: 'inherit',
})

child.on('close', (code) => process.exit(code ?? 1))
child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
