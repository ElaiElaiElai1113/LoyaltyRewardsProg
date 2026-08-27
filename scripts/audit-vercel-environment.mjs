const requiredSupabaseNames = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]

const smtpNames = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
]

export function extractEnvironmentNames(payload) {
  const entries = Array.isArray(payload)
    ? payload
    : payload?.envs ?? payload?.variables ?? payload?.environmentVariables ?? []
  if (!Array.isArray(entries)) throw new Error('Vercel returned an unrecognized environment-variable payload.')
  return new Set(entries.map((entry) => entry?.key ?? entry?.name).filter(Boolean))
}

export function auditEnvironmentNames(names) {
  const missingSupabase = requiredSupabaseNames.filter((name) => !names.has(name))
  const missingSmtp = smtpNames.filter((name) => !names.has(name))
  return { missingSupabase, missingSmtp }
}

async function main() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  const result = auditEnvironmentNames(extractEnvironmentNames(payload))

  if (result.missingSupabase.length) {
    throw new Error(`RewardMe production is missing required Supabase variables: ${result.missingSupabase.join(', ')}`)
  }

  console.log('RewardMe production Supabase variables are present (values were not read or printed).')
  if (result.missingSmtp.length) {
    console.log(`Production SMTP remains incomplete: ${result.missingSmtp.join(', ')}`)
  } else {
    console.log('Production SMTP variable names are present; live delivery and DNS still require an external send check.')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
import { pathToFileURL } from 'node:url'
