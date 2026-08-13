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
    E2E_TENANT_NEIGHBOR_EMAIL: process.env.E2E_WONDERTOWN_NEIGHBOR_EMAIL ?? 'neighbor@wondertown.test',
    E2E_TENANT_BUSINESS_OWNER_EMAIL: process.env.E2E_WONDERTOWN_BUSINESS_OWNER_EMAIL ?? 'owner@wondertown.test',
    E2E_TENANT_BUSINESS_STAFF_EMAIL: process.env.E2E_WONDERTOWN_BUSINESS_STAFF_EMAIL ?? 'staff@wondertown.test',
    E2E_TENANT_BUSINESS_NAME: 'Moonbeam Café',
    E2E_TENANT_PRODUCT_NAME: 'Starlight Latte',
    E2E_TENANT_REWARD_NAME: 'Moonbeam Breakfast',
    E2E_TENANT_GIFT_CARD_NAME: 'Moonbeam Gift Card',
    E2E_TENANT_GIFT_CARD_CODE: process.env.E2E_WONDERTOWN_GIFT_CARD_CODE ?? '',
    E2E_TENANT_GIFT_CARD_RECEIPT: process.env.E2E_WONDERTOWN_GIFT_CARD_RECEIPT ?? '',
    E2E_TENANT_GIFT_CARD_TOTAL: process.env.E2E_WONDERTOWN_GIFT_CARD_TOTAL ?? '',
    E2E_TENANT_GIFT_CARD_DISCOUNT: process.env.E2E_WONDERTOWN_GIFT_CARD_DISCOUNT ?? '',
    E2E_TENANT_GIFT_CARD_FINAL_PRICE: process.env.E2E_WONDERTOWN_GIFT_CARD_FINAL_PRICE ?? '',
  },
  stdio: 'inherit',
})

child.on('close', (code) => process.exit(code ?? 1))
child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
