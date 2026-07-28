import { existsSync, readFileSync } from 'node:fs'

const requiredClientVariables = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const requiredBillingVariables = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]

function readEnvFile() {
  if (!existsSync('.env')) return {}

  return Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const [name, ...valueParts] = line.split('=')
        return [name, valueParts.join('=').replace(/^"|"$/g, '').trim()]
      }),
  )
}

function isPlaceholder(value = '') {
  return !value || /(^your-|replace[_-]|https:\/\/your-project)/i.test(value)
}

export function getE2eReadiness() {
  const environment = { ...readEnvFile(), ...process.env }
  const missingClient = requiredClientVariables.filter((name) => isPlaceholder(environment[name]))
  const missingBilling = requiredBillingVariables.filter((name) => isPlaceholder(environment[name]))

  return {
    missingClient,
    missingBilling,
    authReady: missingClient.length === 0,
    billingReady: missingBilling.length === 0,
  }
}

export function printE2eReadiness({ requireAuth = false } = {}) {
  const readiness = getE2eReadiness()

  console.log(`Authenticated browser workflows: ${readiness.authReady ? 'ready' : 'not ready'}`)
  if (readiness.missingClient.length) {
    console.log(`  Missing: ${readiness.missingClient.join(', ')}`)
  }

  console.log(`Stripe billing integration: ${readiness.billingReady ? 'ready' : 'not ready'}`)
  if (readiness.missingBilling.length) {
    console.log(`  Missing: ${readiness.missingBilling.join(', ')}`)
  }

  if (requireAuth && !readiness.authReady) {
    console.error(
      '\nAuthenticated Playwright tests were requested but Supabase is not configured. ' +
        'Create .env from .env.example, start/reset Supabase, then rerun this command.',
    )
    return false
  }

  return true
}

if (process.argv[1]?.endsWith('check-e2e-readiness.mjs')) {
  process.exitCode = printE2eReadiness({ requireAuth: process.argv.includes('--require-auth') }) ? 0 : 1
}
