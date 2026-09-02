import assert from 'node:assert/strict'
import test from 'node:test'

import { ensureDirectProjectDomain, parseArguments } from './ensure-direct-vercel-domain.mjs'

const options = {
  project: 'loyalty-rewards-prog',
  domain: 'loyalty-rewards-prog.vercel.app',
  scope: 'elaielaielai1113s-projects',
  token: 'test-token',
}

function response(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

test('parses only the required direct-domain arguments', () => {
  assert.deepEqual(parseArguments([
    '--project', options.project,
    '--domain', options.domain,
    '--scope', options.scope,
  ]), {
    project: options.project,
    domain: options.domain,
    scope: options.scope,
  })
  assert.throws(() => parseArguments(['--project', '../unsafe']), /valid project/)
})

test('removes a configured project-domain redirect', async () => {
  const calls = []
  const result = await ensureDirectProjectDomain(options, async (url, init) => {
    calls.push({ url: String(url), init })
    return calls.length === 1
      ? response({ name: options.domain, redirect: 'rewardme-prod.vercel.app', redirectStatusCode: 307 })
      : response({ name: options.domain, redirect: null, redirectStatusCode: null })
  })

  assert.deepEqual(result, { domain: options.domain, redirect: null, changed: true })
  assert.equal(calls[0].init.method, undefined)
  assert.equal(calls[1].init.method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[1].init.body), { redirect: null, redirectStatusCode: null })
  assert.match(calls[0].url, /slug=elaielaielai1113s-projects/)
})

test('leaves an already-direct domain unchanged', async () => {
  let calls = 0
  const result = await ensureDirectProjectDomain(options, async () => {
    calls += 1
    return response({ name: options.domain, redirect: null })
  })

  assert.equal(calls, 1)
  assert.deepEqual(result, { domain: options.domain, redirect: null, changed: false })
})
