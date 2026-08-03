import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const runner = fileURLToPath(new URL('./run-tenant-authenticated-smoke.mjs', import.meta.url))

const child = spawn(process.execPath, [runner], {
  cwd: repoRoot,
  env: {
    ...process.env,
    E2E_BASE_URL: process.env.E2E_BASE_URL ?? 'https://wondertown-rewards.vercel.app',
    E2E_TENANT_NAME: 'Wondertown Rewards',
    E2E_TENANT_CUSTOMER_EMAIL: process.env.E2E_WONDERTOWN_CUSTOMER_EMAIL ?? 'member@wondertown.test',
    E2E_TENANT_BUSINESS_OWNER_EMAIL: process.env.E2E_WONDERTOWN_BUSINESS_OWNER_EMAIL ?? 'owner@wondertown.test',
    E2E_TENANT_BUSINESS_NAME: 'Moonbeam Café',
    E2E_TENANT_PRODUCT_NAME: 'Starlight Latte',
    E2E_TENANT_REWARD_NAME: 'Moonbeam Breakfast',
    E2E_TENANT_GIFT_CARD_NAME: 'Moonbeam Gift Card',
  },
  stdio: 'inherit',
})

child.on('close', (code) => process.exit(code ?? 1))
child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
