import { pathToFileURL } from 'node:url'

const API_ORIGIN = 'https://api.vercel.com'

export function parseArguments(argv) {
  const options = { project: '', domain: '', scope: '' }
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index]
    if (key === '--project' || key === '--domain' || key === '--scope') {
      options[key.slice(2)] = argv[index + 1] ?? ''
      index += 1
    } else {
      throw new Error(`Unknown argument: ${key}`)
    }
  }

  for (const [name, value] of Object.entries(options)) {
    if (!value || !/^[a-z0-9.-]+$/i.test(value)) throw new Error(`A valid ${name} is required.`)
  }
  return options
}

async function readJson(response) {
  const text = await response.text()
  if (!response.ok) {
    let detail = text
    try {
      detail = JSON.parse(text)?.error?.message ?? text
    } catch {
      // Keep the plain response text.
    }
    throw new Error(`Vercel domain request failed (${response.status}): ${detail}`)
  }
  return text ? JSON.parse(text) : {}
}

export async function ensureDirectProjectDomain({ project, domain, scope, token }, fetchImpl = fetch) {
  if (!token) throw new Error('VERCEL_TOKEN is required.')

  const endpoint = new URL(`/v9/projects/${encodeURIComponent(project)}/domains/${encodeURIComponent(domain)}`, API_ORIGIN)
  endpoint.searchParams.set('slug', scope)
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  const current = await readJson(await fetchImpl(endpoint, { headers }))

  if (current.redirect === null || current.redirect === undefined) {
    return { domain, redirect: null, changed: false }
  }

  const updated = await readJson(await fetchImpl(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ redirect: null, redirectStatusCode: null }),
  }))
  if (updated.redirect !== null && updated.redirect !== undefined) {
    throw new Error(`Vercel kept an unexpected redirect on ${domain}.`)
  }

  return { domain, redirect: null, changed: true }
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const result = await ensureDirectProjectDomain({
    ...options,
    token: process.env.VERCEL_TOKEN?.trim() ?? '',
  })
  console.log(JSON.stringify(result, null, 2))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
