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

const target = String(process.argv[2] ?? '').trim().toLowerCase()
const configurations = {
  rewardme: {
    baseUrl: process.env.E2E_REWARDME_URL ?? 'https://rewardme-prod.vercel.app',
    customer: process.env.E2E_REWARDME_MEMBER_EMAIL ?? 'member@rewardme.test',
    owner: process.env.E2E_REWARDME_BUSINESS_OWNER_EMAIL ?? 'owner@rewardme.test',
    staff: process.env.E2E_REWARDME_BUSINESS_STAFF_EMAIL ?? 'staff@rewardme.test',
    admin: process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test',
    businessSlug: 'rewardme-partner',
  },
  wondertown: {
    baseUrl: process.env.E2E_WONDERTOWN_URL ?? 'https://wondertown-rewards.vercel.app',
    customer: process.env.E2E_WONDERTOWN_CUSTOMER_EMAIL ?? 'member@wondertown.test',
    owner: process.env.E2E_WONDERTOWN_BUSINESS_OWNER_EMAIL ?? 'owner@wondertown.test',
    staff: process.env.E2E_WONDERTOWN_BUSINESS_STAFF_EMAIL ?? 'staff@wondertown.test',
    admin: process.env.E2E_WONDERTOWN_ADMIN_EMAIL ?? process.env.E2E_REWARDME_ADMIN_EMAIL ?? 'admin@rewardsplatform.test',
    businessSlug: 'wondertown-moonbeam-cafe',
  },
}

const configuration = configurations[target]
if (!configuration) {
  throw new Error('Choose exactly one live gift-card target: rewardme or wondertown.')
}

const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'E2E_PASSWORD']
const missing = required.filter((name) => !process.env[name])
if (missing.length) {
  throw new Error(`Missing live gift-card workflow variables: ${missing.join(', ')}.`)
}

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
const child = spawn(process.execPath, [
  playwrightCli,
  'test',
  'tests/e2e/gift-cards.spec.ts',
  '--config=playwright.local.config.ts',
  '--workers=1',
], {
  cwd: repoRoot,
  env: {
    ...process.env,
    E2E_AUTH_ENABLED: 'true',
    E2E_BASE_URL: configuration.baseUrl,
    E2E_CUSTOMER_EMAIL: configuration.customer,
    E2E_BUSINESS_OWNER_EMAIL: configuration.owner,
    E2E_BUSINESS_STAFF_EMAIL: configuration.staff,
    E2E_ADMIN_EMAIL: configuration.admin,
    E2E_BUSINESS_SLUG: configuration.businessSlug,
    WORKFLOW_TEST_RUN_ID: `${target}-${Date.now()}`,
  },
  stdio: 'inherit',
})

child.on('close', (code) => process.exit(code ?? 1))
child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
