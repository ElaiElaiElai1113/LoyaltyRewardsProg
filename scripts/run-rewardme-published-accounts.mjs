import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const baseUrl = process.env.E2E_BASE_URL ?? 'https://loyalty-rewards-prog.vercel.app'

const child = spawn(
  process.execPath,
  [
    playwrightCli,
    'test',
    'tests/e2e/rewardme-published-accounts.spec.ts',
    '--config=playwright.remote.config.ts',
    '--workers=1',
  ],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      E2E_BASE_URL: baseUrl,
      E2E_REWARDME_PUBLIC_ACCOUNT_CHECK: 'true',
    },
    stdio: 'inherit',
  },
)

child.on('close', (code) => process.exit(code ?? 1))
