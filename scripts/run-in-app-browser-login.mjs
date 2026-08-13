import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))

const child = spawn(
  process.execPath,
  [
    playwrightCli,
    'test',
    'tests/e2e/in-app-browser-login.spec.ts',
    '--config=playwright.remote.config.ts',
    '--workers=1',
  ],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      E2E_IN_APP_BROWSER_ACCOUNT_CHECK: 'true',
    },
    stdio: 'inherit',
  },
)

child.on('close', (code) => process.exit(code ?? 1))
