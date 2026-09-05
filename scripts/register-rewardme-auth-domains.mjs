import { pathToFileURL } from 'node:url'

export function addRewardMeAuthRedirects(existing = '') {
  const redirects = new Set(existing.split(',').map(value => value.trim()).filter(Boolean))
  for (const origin of ['https://myrewardme.com', 'https://www.myrewardme.com']) {
    for (const path of ['/', '/auth/confirm', '/reset-password', '/accept-invitation']) redirects.add(origin + path)
  }
  return [...redirects].join(',')
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token || process.env.PROJECT_REF !== 'bftuvmywtmpflizsomim') throw new Error('The dedicated rewards project credentials are required.')
  const endpoint = `https://api.supabase.com/v1/projects/${process.env.PROJECT_REF}/config/auth`
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const currentResponse = await fetch(endpoint, { headers, signal: AbortSignal.timeout(30000) })
  if (!currentResponse.ok) throw new Error(`Auth configuration read failed: ${currentResponse.status}`)
  const current = await currentResponse.json()
  const uriAllowList = addRewardMeAuthRedirects(current.uri_allow_list ?? '')
  if (!process.argv.includes('--apply')) {
    console.log(JSON.stringify({ project: process.env.PROJECT_REF, redirectCount: uriAllowList.split(',').length, apply: false }))
    return
  }
  const response = await fetch(endpoint, {
    method: 'PATCH', headers, body: JSON.stringify({ uri_allow_list: uriAllowList }), signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`Auth redirect update failed: ${response.status}`)
  const verificationResponse = await fetch(endpoint, { headers, signal: AbortSignal.timeout(30000) })
  if (!verificationResponse.ok) throw new Error(`Auth redirect verification failed: ${verificationResponse.status}`)
  const updated = await verificationResponse.json()
  const actual = new Set((updated.uri_allow_list ?? '').split(',').map(value => value.trim()))
  if (uriAllowList.split(',').some(value => !actual.has(value)) || updated.site_url !== current.site_url) {
    throw new Error('Auth redirects or existing site URL did not match the scoped update.')
  }
  console.log(JSON.stringify({ project: process.env.PROJECT_REF, verified: true, siteUrlPreserved: true, redirectCount: actual.size }))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main()
