const mode = process.argv.includes('--production') ? 'production' : 'staging'
const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_PUBLIC_SITE_URL']
const serverRequired = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_SECURE', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
const deferred = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']
const placeholder = /replace|your-project|example\.com|_here|your-/i
const checks = [...required, ...serverRequired].map((name) => {
  const value = process.env[name] ?? ''
  return { name, passed: Boolean(value) && !placeholder.test(value), reason: !value ? 'missing' : placeholder.test(value) ? 'placeholder' : 'configured' }
})
const siteUrl = process.env.VITE_PUBLIC_SITE_URL ?? ''
checks.push({ name: 'VITE_PUBLIC_SITE_URL_HTTPS', passed: mode !== 'production' || siteUrl.startsWith('https://'), reason: siteUrl })
checks.push({
  name: 'VITE_TENANT_STATE_RPC_ENABLED',
  passed: process.env.VITE_TENANT_STATE_RPC_ENABLED === 'true',
  reason: 'Enable only after migration 20260729000000 is applied',
})
const report = {
  mode,
  generatedAt: new Date().toISOString(),
  passed: checks.every((check) => check.passed),
  checks,
  deferred: deferred.map((name) => ({ name, configured: Boolean(process.env[name]) })),
}
console.log(JSON.stringify(report, null, 2))
process.exit(report.passed ? 0 : 1)
