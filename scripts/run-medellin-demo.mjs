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
const baseUrl = process.env.E2E_BASE_URL ?? 'https://www.medellinrewards.com'

if (!process.env.E2E_PASSWORD) {
  console.error('E2E_PASSWORD is required for the Medellin demo rehearsal.')
  process.exit(1)
}

const child = spawn(
  process.execPath,
  [
    playwrightCli,
    'test',
    'tests/e2e/medellin-demo.spec.ts',
    '--config=playwright.local.config.ts',
    '--workers=1',
  ],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      E2E_BASE_URL: baseUrl,
      E2E_INCLUDE_MEDELLIN_DEMO: 'true',
    },
    stdio: 'inherit',
  },
)

child.on('close', (code) => process.exit(code ?? 1))
child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
