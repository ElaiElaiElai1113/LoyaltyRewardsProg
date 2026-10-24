import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import yaml from 'js-yaml'

const read = (name) => yaml.load(readFileSync(`.github/workflows/${name}.yml`, 'utf8'))
const tenant = read('tenant-deployment')
const job = tenant.jobs.synchronize
const context = (eventName, legacy = false, overrides = {}) => ({
  github: { event_name: eventName, repository: 'owner/rewards', event: { workflow_run: {
    conclusion: 'success', head_branch: 'main', event: 'push',
    head_repository: { full_name: 'owner/rewards' }, ...overrides,
  } } }, inputs: { legacy_tenant_sync: legacy },
})
const enabled = (expression, context) => !expression || Function('github', 'inputs', 'always', `return (${expression})`)(context.github, context.inputs, () => true)
const active = (context) => job.steps.filter(step => enabled(step.if, context))

test('automatic release requires successful same-repository main push CI', () => {
  assert.equal(enabled(job.if, context('workflow_run')), true)
  for (const overrides of [{ conclusion: 'failure' }, { head_branch: 'feature' }, { event: 'pull_request' }, { head_repository: { full_name: 'fork/rewards' } }]) {
    assert.equal(enabled(job.if, context('workflow_run', false, overrides)), false)
  }
  assert.equal(enabled(job.if, context('workflow_dispatch')), true)
})

test('legacy synchronization and secret writes require explicit manual boolean opt-in', () => {
  assert.deepEqual(tenant.on.workflow_dispatch.inputs.legacy_tenant_sync, {
    description: 'Run legacy multi-tenant deployment, alias synchronization and server-secret refresh',
    required: false, type: 'boolean', default: false,
  })
  for (const ctx of [context('workflow_run'), context('workflow_run', true), context('workflow_dispatch')]) {
    const commands = active(ctx).map(step => step.run || '').join('\n')
    assert.doesNotMatch(commands, /ops:deploy:tenants|vercel env add|alias set/)
  }
  const manual = active(context('workflow_dispatch', true)).map(step => step.run || '').join('\n')
  assert.match(manual, /ops:deploy:tenants/)
  assert.match(manual, /vercel env add/)
})

test('automatic deploy uses only the bounded RewardMe publisher and exact checkout', () => {
  assert.equal(job.env.VERCEL_SCOPE, 'elaielaielai1113s-projects')
  const deployments = active(context('workflow_run')).filter(step => /publish-reviewed-site\.mjs rewardme/.test(step.run || ''))
  assert.equal(deployments.length, 1)
  assert.match(deployments[0].run, /publish-reviewed-site.mjs rewardme "\$EXPECTED_COMMIT_SHA"/)
  assert.doesNotMatch(active(context('workflow_run')).map(step => step.run || '').join('\n'), /vercel deploy|vercel promote/)
  assert.match(job.steps.find(step => step.name === 'Require deployment credentials').run, /git rev-parse HEAD/)
  assert.match(job.steps.find(step => step.name === 'Require deployment credentials').run, /\{40\}/)
  assert.equal(job.steps.find(step => step.uses?.startsWith('actions/checkout')).with.ref, '${{ github.event.workflow_run.head_sha || inputs.commit_sha || github.sha }}')
})

test('automatic exact-source domain verification covers only RewardMe addresses', () => {
  const commands = active(context('workflow_run')).map(step => step.run || '').join('\n')
  const checks = [...commands.matchAll(/ops:domain:check -- "([^"]+)" "([^"]+)" --expected-version "\$EXPECTED_COMMIT_SHA"/g)]
  assert.deepEqual(checks.map(match => [match[1], match[2]]), [
    ['myrewardme.com', 'RewardMe'], ['www.myrewardme.com', 'RewardMe'],
    ['loyalty-rewards-prog.vercel.app', 'RewardMe'], ['rewardme-prod.vercel.app', 'RewardMe'],
    ['reward-me-prog.vercel.app', 'RewardMe'],
  ])
  assert.doesNotMatch(commands, /guatemalarewards\.com|medellinrewards\.com|pinas-rewards\.vercel\.app|wondertown-rewards\.vercel\.app/)
})

test('Loyality preserves its project/credentials and uses bounded publishing without automatic environment writes', () => {
  const workflow = read('loyality-production'), deploy = workflow.jobs.deploy
  assert.equal(deploy.env.VERCEL_PROJECT, 'loyality-rewards')
  const step = deploy.steps.find(step => step.name === 'Deploy Loyality')
  assert.match(step.run, /publish-reviewed-site.mjs loyality "\$EXPECTED_COMMIT_SHA"/)
  assert.equal(step.env.VERCEL_TOKEN, '${{ secrets.VERCEL_TOKEN }}')
  const configuration = deploy.steps.find(step => step.name === 'Configure Loyality production')
  assert.doesNotMatch(configuration.run, /env add REWARDS_SOURCE_COMMIT/)
  assert.equal(workflow.on.workflow_dispatch.inputs.refresh_server_environment.default, false)
  assert.equal(enabled(configuration.if, context('push')), false)
  assert.equal(enabled(configuration.if, context('workflow_dispatch')), false)
  assert.equal(enabled(configuration.if, {github:{event_name:'workflow_dispatch'}, inputs:{refresh_server_environment:true}}), true)
  assert.deepEqual(workflow.concurrency, tenant.concurrency)
  assert.equal(workflow.concurrency['cancel-in-progress'], false)
  assert.equal(workflow.on.push, undefined)
  assert.deepEqual(workflow.on.workflow_run, tenant.on.workflow_run)
  assert.equal(deploy.if, job.if)
  assert.equal(deploy.steps.find(step => step.uses?.startsWith('actions/checkout')).with.ref, '${{ github.event.workflow_run.head_sha || github.sha }}')
  assert.equal(deploy.env.EXPECTED_COMMIT_SHA, '${{ github.event.workflow_run.head_sha || github.sha }}')
})

test('both publishers enforce focused contracts before external operations, including manual runs', () => {
  for (const steps of [job.steps, read('loyality-production').jobs.deploy.steps]) {
    const contract = steps.findIndex(step => step.run?.includes('node --test scripts/deployment-workflows.test.mjs scripts/publish-reviewed-site.test.mjs'))
    const firstExternal = steps.findIndex(step => /vercel env|publish-reviewed-site.mjs (rewardme|loyality)|curl/.test(step.run || ''))
    assert(contract >= 0 && contract < firstExternal)
  }
})

test('Git-driven deployment is disabled so only bounded workflows assign production domains', () => {
  const config = JSON.parse(readFileSync('vercel.json', 'utf8'))
  assert.equal(config.git.deploymentEnabled, false)
})

test('scope regression tests are enforced in main CI and legacy verifier remains manual', () => {
  const ci = read('ci')
  assert(ci.jobs.frontend.steps.some(step => step.run?.includes('node --test scripts/deployment-workflows.test.mjs')))
  assert.equal(read('post-deployment').jobs.verify.if, "github.event_name == 'workflow_dispatch'")
})
