import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

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
