import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const runner = fileURLToPath(new URL('./run-playwright-local.mjs', import.meta.url))

const child = spawn(
  process.execPath,
  [runner, 'tests/e2e/rewardme-release-mode.spec.ts', '--workers=1'],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      E2E_INCLUDE_REWARDME_RELEASE_MODE: 'true',
      VITE_SHOW_PUBLIC_QA_CREDENTIALS: 'false',
    },
    stdio: 'inherit',
  },
)

child.on('close', (code) => process.exit(code ?? 1))
