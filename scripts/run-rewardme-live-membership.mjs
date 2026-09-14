import { verifyHostedAcceptance, assertApprovedTestAccounts } from './verify-hosted-acceptance.mjs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))

assertApprovedTestAccounts([process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test',process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test'])
await verifyHostedAcceptance()

const child = spawn(process.execPath, [
  playwrightCli,
  'test',
  'tests/e2e/rewardme-manual-membership-live.spec.ts',
  '--config=playwright.remote.config.ts',
  '--workers=1',
], {
  cwd: repoRoot,
  env: {
    ...process.env,
    E2E_BASE_URL: process.env.E2E_BASE_URL,
    E2E_AUTH_ENABLED: 'true',
    E2E_REWARDME_MEMBERSHIP_OPERATIONS_CHECK: 'true',
  },
  stdio: 'inherit',
})

child.on('close', (code) => process.exit(code ?? 1))
child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
