import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractDeploymentUrl, normalizeCommitSha, resolveVercelInvocation } from './deploy-tenant-sites.mjs'

export const scope = 'elaielaielai1113s-projects'
export const teamId = 'team_iq0fxUZhStWlQQjamjS1ONwR'
export const protectedMappings = Object.freeze({
  'wondertown-rewards.vercel.app': Object.freeze({ projectId: 'prj_PaxiTVRFRuqys5uKfDXUL3ieSHKF', deploymentId: 'dpl_78caMpUs6zsTFg7NGW8jub4SNypD' }),
  'pinas-rewards.vercel.app': Object.freeze({ projectId: 'prj_PaxiTVRFRuqys5uKfDXUL3ieSHKF', deploymentId: 'dpl_GikUCoGgrFurhkphhrThUc2r1pUR' }),
})
export const targets = Object.freeze({
  rewardme: Object.freeze({ project: 'loyalty-rewards-prog', projectId: 'prj_PaxiTVRFRuqys5uKfDXUL3ieSHKF', backend: 'bftuvmywtmpflizsomim', aliases: Object.freeze(['myrewardme.com', 'www.myrewardme.com', 'rewardme-prod.vercel.app', 'reward-me-prog.vercel.app', 'loyalty-rewards-prog.vercel.app']) }),
  loyality: Object.freeze({ project: 'loyality-rewards', projectId: 'prj_tiFNyQNSAlLpNfX7Mok03DOrclvH', backend: 'bftuvmywtmpflizsomim', aliases: Object.freeze(['loyality-rewards.vercel.app']) }),
})

function mapping(record) {
  if (!record?.alias || !record.projectId || !record.deploymentId) throw new Error('Incomplete alias mapping; refusing publication')
  return { alias: record.alias, projectId: record.projectId, deploymentId: record.deploymentId, redirect: record.redirect ?? null, redirectStatusCode: record.redirectStatusCode ?? null }
}
function same(left, right) { return JSON.stringify(left) === JSON.stringify(right) }

export function vercelArguments(args, token) {
  // Vercel curl forwards even nominal global flags to OS curl. Use its linked
  // cwd and supported VERCEL_TOKEN environment authentication instead.
  return args[0] === 'curl' ? [...args] : [...args, '--scope', scope, '--token', token]
}

export async function readCandidateHealth(origin, run, linkedDirectory, existingBypass) {
  if (!existingBypass?.trim()) throw new Error('Existing automation bypass required; creation is forbidden')
  const raw = await run(['curl', '/api/health', '--deployment', origin, '--', '--silent', '--show-error', '--fail', '--max-time', '30', '--write-out', '\n%{http_code} %{content_type}'], { cwd: linkedDirectory, env: { VERCEL_AUTOMATION_BYPASS_SECRET: existingBypass } })
  const separator = raw.lastIndexOf('\n')
  if (separator < 0 || !/^200 application\/json(?:;.*)?$/.test(raw.slice(separator + 1).trim())) throw new Error('Candidate health requires HTTP 200 JSON without redirects')
  try { return JSON.parse(raw.slice(0, separator)) } catch { throw new Error('Candidate health returned invalid JSON') }
}

export async function publishReviewedSite({ target, sha }, { run, health, assertCurrentMain, record = async () => {} }) {
  const config = targets[target]
  if (!config) throw new Error('Only rewardme or loyality may be published')
  sha = normalizeCommitSha(sha)
  const state = { target, sha, project: config.project, phase: 'preflight', assigned: [] }
  const api = async path => JSON.parse(await run(['api', `${path}${path.includes('?') ? '&' : '?'}teamId=${teamId}`]))
  const getAlias = async host => mapping(await api(`/v4/aliases/${encodeURIComponent(host)}`))
  async function snapshot() {
    const aliases = new Map(), cursors = new Set()
    let cursor = ''
    do {
      const page = await api(`/v4/aliases?limit=100${cursor ? `&until=${cursor}` : ''}`)
      if (!Array.isArray(page.aliases)) throw new Error('Incomplete alias inventory')
      for (const alias of page.aliases) {
        // Alias inventory can include deleted entries; live entries must be complete.
        if (!alias.deletedAt) aliases.set(alias.alias, mapping(alias))
      }
      cursor = page.pagination?.next ?? ''
      if (cursor && cursors.has(cursor)) throw new Error('Alias pagination did not advance')
      cursors.add(cursor)
    } while (cursor)
    for (const [host, pin] of Object.entries(protectedMappings)) {
      const current = aliases.get(host)
      if (!current || current.projectId !== pin.projectId || current.deploymentId !== pin.deploymentId || current.redirect) throw new Error(`Protected alias pin drift: ${host}`)
    }
    return aliases
  }
  async function verifyBaseline(before, allowedChanges = new Set()) {
    const current = await snapshot()
    for (const [host, value] of before) {
      const alias = current.get(host)
      if (allowedChanges.has(host)) {
        if (alias?.projectId !== config.projectId || alias.deploymentId !== state.deploymentId || alias.redirect) throw new Error(`Published alias drift: ${host}`)
      } else if (!same(value, alias)) throw new Error(`Alias drift detected: ${host}`)
    }
  }
  try {
    const project = await api(`/v9/projects/${config.project}`)
    if (project.id !== config.projectId || project.name !== config.project || project.accountId !== teamId) throw new Error('Project identity drift')
    const existingBypass = Object.keys(project.protectionBypass ?? {}).find(key => project.protectionBypass[key]?.scope === 'automation-bypass')
    if (!existingBypass) throw new Error('Existing automation bypass required; creation is forbidden')
    const before = await snapshot()
    state.before = Object.fromEntries(before)
    for (const host of config.aliases) {
      const alias = await getAlias(host)
      if (alias.projectId !== config.projectId || alias.redirect || !same(alias, before.get(host))) throw new Error(`Unapproved alias mapping: ${host}`)
    }
    await record(state)
    await assertCurrentMain(sha)
    state.phase = 'stage'
    const url = extractDeploymentUrl(await run(['deploy', '--prod', '--skip-domain', '--yes', '--force', '--project', config.project,
      '--env', `REWARDS_SOURCE_COMMIT=${sha}`, '--meta', `githubCommitSha=${sha}`]))
    state.candidate = url
    const candidate = await api(`/v13/deployments/${new URL(url).hostname}`)
    if (candidate.projectId !== config.projectId || candidate.readyState !== 'READY' || candidate.target !== 'production' || candidate.meta?.githubCommitSha !== sha || !candidate.id) throw new Error('Candidate deployment identity/source mismatch')
    const status = await health(url, existingBypass)
    if (status.ok !== true || status.status !== 'ready' || status.database !== 'reachable' || status.sourceRevision !== sha || status.projectRef !== config.backend) throw new Error('Candidate health/source/backend mismatch')
    state.deploymentId = candidate.id
    state.phase = 'verified'
    await verifyBaseline(before)
    await record(state)
    state.phase = 'assign'
    for (const host of config.aliases) {
      await assertCurrentMain(sha)
      await verifyBaseline(before, new Set(state.assigned))
      if (!same(await getAlias(host), before.get(host))) throw new Error(`Alias changed before assignment: ${host}`)
      state.pendingAlias = host
      await record(state)
      await run(['alias', 'set', url, host])
      state.assigned.push(host)
      await record(state)
      const assigned = await getAlias(host)
      if (assigned.projectId !== config.projectId || assigned.deploymentId !== candidate.id || assigned.redirect) throw new Error(`Alias assignment verification failed: ${host}`)
      delete state.pendingAlias
    }
    await verifyBaseline(before, new Set(config.aliases))
    for (const host of config.aliases) {
      const final = await getAlias(host)
      if (final.projectId !== config.projectId || final.deploymentId !== candidate.id || final.redirect) throw new Error(`Published alias drift: ${host}`)
    }
    state.phase = 'complete'
    return state
  } catch (error) {
    state.error = error.message
    throw error
  } finally {
    await record(state)
  }
}

async function main() {
  const [target, rawSha, output] = process.argv.slice(2)
  if (!output || process.argv.length !== 5) throw new Error('Usage: node scripts/publish-reviewed-site.mjs rewardme|loyality <full-sha> <evidence.json>')
  const sha = normalizeCommitSha(rawSha)
  const checkout = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' })
  if (checkout.status !== 0 || checkout.stdout.trim() !== sha) throw new Error('Checkout must match requested source SHA')
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=normal'], { encoding: 'utf8' })
  if (status.status !== 0 || status.stdout.trim()) throw new Error('Use a clean checkout without untracked source before publication')
  if (!process.env.VERCEL_TOKEN) throw new Error('VERCEL_TOKEN required')
  const cli = resolveVercelInvocation(process.env.VERCEL_CLI_BIN)
  const run = async (args, { cwd = process.cwd(), env = {} } = {}) => {
    const result = spawnSync(cli.executable, [...cli.prefixArguments, ...vercelArguments(args, process.env.VERCEL_TOKEN)], { cwd, env: { ...process.env, ...env }, encoding: 'utf8', timeout: 15 * 60 * 1000, maxBuffer: 20 * 1024 * 1024 })
    if (result.error || result.status !== 0) throw new Error(`Vercel ${args[0]} failed; inspect platform logs (credentials omitted)`)
    return result.stdout.trim()
  }
  if (!targets[target]) throw new Error('Only rewardme or loyality may be published')
  const healthDirectory = resolve(dirname(output), `health-client-${target}`)
  await mkdir(resolve(healthDirectory, '.vercel'), { recursive: true })
  await writeFile(resolve(healthDirectory, '.vercel/project.json'), JSON.stringify({ orgId: teamId, projectId: targets[target].projectId }))
  const assertCurrentMain = async expected => {
    const remote = spawnSync('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/main'], { encoding: 'utf8', timeout: 30000 })
    if (remote.status !== 0 || remote.stdout.trim().split(/\s+/)[0] !== expected) throw new Error('Source is stale or origin/main cannot be verified; publication stopped')
  }
  await publishReviewedSite({ target, sha }, { run, assertCurrentMain, health: (origin, bypass) => readCandidateHealth(origin, run, healthDirectory, bypass), record: async state => {
    await mkdir(dirname(resolve(output)), { recursive: true })
    await writeFile(output, JSON.stringify(state, null, 2))
  } })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1 })
}
