import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const deploymentDefaults = Object.freeze({
  scope: 'elaielaielai1113s-projects',
  primaryProject: 'loyalty-rewards-prog',
  guatemalaProject: 'guatemala-rewards',
  aliases: ['pinas-rewards.vercel.app', 'wondertown-rewards.vercel.app'],
})

export function normalizeCommitSha(value) {
  const sha = String(value ?? '').trim().toLowerCase()
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error('A full 40-character Git commit SHA is required.')
  }
  return sha
}

export function selectReadyProductionDeployment(payload, expectedSha) {
  const sha = normalizeCommitSha(expectedSha)
  const deployments = Array.isArray(payload?.deployments) ? payload.deployments : []
  const matches = deployments
    .filter((deployment) => (
      deployment?.state === 'READY'
      && deployment?.target === 'production'
      && String(deployment?.meta?.githubCommitSha ?? '').toLowerCase() === sha
      && typeof deployment?.url === 'string'
      && deployment.url.endsWith('.vercel.app')
    ))
    .sort((left, right) => Number(right.createdAt ?? 0) - Number(left.createdAt ?? 0))

  if (!matches[0]) {
    throw new Error(`No ready production deployment matches commit ${sha.slice(0, 12)}.`)
  }

  return `https://${matches[0].url}`
}

export function extractDeploymentUrl(output) {
  const text = String(output ?? '').trim()
  if (!text) throw new Error('Vercel did not return a deployment URL.')

  try {
    const parsed = JSON.parse(text)
    const candidate = parsed?.deployment?.url ?? parsed?.url
    if (typeof candidate === 'string' && candidate.startsWith('https://') && candidate.endsWith('.vercel.app')) {
      return candidate
    }
  } catch {
    // Plain CLI output is handled below.
  }

  const match = text.match(/https:\/\/[a-z0-9-]+\.vercel\.app\b/i)
  if (!match) throw new Error('Vercel output did not contain a deployment URL.')
  return match[0]
}

export function parseArguments(argv) {
  const options = { sha: '', output: '', dryRun: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--dry-run') {
      options.dryRun = true
    } else if (argument === '--sha') {
      options.sha = argv[index + 1] ?? ''
      index += 1
    } else if (argument === '--output') {
      options.output = argv[index + 1] ?? ''
      index += 1
    } else {
      throw new Error(`Unknown argument: ${argument}`)
    }
  }
  options.sha = normalizeCommitSha(options.sha)
  return options
}

function redact(value, secret) {
  return secret ? String(value).replaceAll(secret, '[redacted]') : String(value)
}

function readPositiveInteger(value, fallback, name) {
  const parsed = Number.parseInt(String(value ?? fallback), 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer.`)
  }
  return parsed
}

function locateWindowsCommand(executable) {
  const result = spawnSync('where.exe', [executable], { encoding: 'utf8' })
  return result.status === 0 ? result.stdout.split(/\r?\n/).find(Boolean)?.trim() ?? '' : ''
}

export function resolveVercelInvocation(configuredExecutable, helpers = {}) {
  const platform = helpers.platform ?? process.platform
  const fileExists = helpers.fileExists ?? existsSync
  const locateCommand = helpers.locateCommand ?? locateWindowsCommand
  const nodeExecutable = helpers.nodeExecutable ?? process.execPath
  const executable = configuredExecutable?.trim()
    || (platform === 'win32' ? 'vercel.cmd' : 'vercel')

  if (platform !== 'win32') return { executable, prefixArguments: [] }

  const commandPath = isAbsolute(executable) ? executable : locateCommand(executable)
  if (!commandPath.toLowerCase().endsWith('.cmd')) return { executable, prefixArguments: [] }

  const commandDirectory = dirname(commandPath)
  const cliCandidates = [
    resolve(commandDirectory, '..', 'vercel', 'dist', 'index.js'),
    resolve(commandDirectory, 'node_modules', 'vercel', 'dist', 'index.js'),
  ]
  const cliPath = cliCandidates.find((candidate) => fileExists(candidate))
  if (!cliPath) return { executable, prefixArguments: [] }

  return { executable: nodeExecutable, prefixArguments: [cliPath] }
}

function runVercel(argumentsList, { capture = false, scope, token }) {
  const invocation = resolveVercelInvocation(process.env.VERCEL_CLI_BIN)
  const authentication = token ? ['--token', token] : []
  const result = spawnSync(
    invocation.executable,
    [...invocation.prefixArguments, ...argumentsList, '--scope', scope, ...authentication],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
      stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      timeout: 10 * 60 * 1000,
    },
  )

  if (result.error) throw result.error
  if (result.status !== 0) {
    const detail = redact(result.stderr || result.stdout || 'Vercel command failed.', token).trim()
    throw new Error(detail)
  }

  if (capture && result.stderr) process.stderr.write(redact(result.stderr, token))
  return capture ? result.stdout.trim() : ''
}

async function writeSummary(path, summary) {
  if (!path) return
  const output = resolve(path)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`)
}

export async function deployTenantSites(options, environment = process.env) {
  const sha = normalizeCommitSha(options.sha)
  const scope = environment.VERCEL_SCOPE?.trim() || deploymentDefaults.scope
  const token = environment.VERCEL_TOKEN?.trim() || ''
  const primaryProject = environment.VERCEL_PRIMARY_PROJECT?.trim() || deploymentDefaults.primaryProject
  const guatemalaProject = environment.VERCEL_GUATEMALA_PROJECT?.trim() || deploymentDefaults.guatemalaProject

  if (options.dryRun) {
    return {
      dryRun: true,
      sha,
      scope,
      primaryProject,
      guatemalaProject,
      aliases: deploymentDefaults.aliases,
      actions: [
        'resolve the ready primary production deployment for the exact commit',
        'deploy the exact checkout to the Guatemala production project',
        'point the independent Pinas Rewards and Wondertown hostnames to the resolved primary deployment',
      ],
    }
  }

  if (environment.CI && !token) {
    throw new Error('VERCEL_TOKEN is required in CI.')
  }

  const retryAttempts = readPositiveInteger(
    environment.PRIMARY_DEPLOYMENT_RETRY_ATTEMPTS,
    30,
    'PRIMARY_DEPLOYMENT_RETRY_ATTEMPTS',
  )
  const retryDelayMs = readPositiveInteger(
    environment.PRIMARY_DEPLOYMENT_RETRY_DELAY_MS,
    10_000,
    'PRIMARY_DEPLOYMENT_RETRY_DELAY_MS',
  )
  let primaryDeployment = ''
  let lastResolutionError

  for (let attempt = 1; attempt <= retryAttempts; attempt += 1) {
    console.log(`Resolving ${primaryProject} production deployment for ${sha.slice(0, 12)} (attempt ${attempt}/${retryAttempts})...`)
    try {
      const deploymentListOutput = runVercel([
        'list',
        primaryProject,
        '--prod',
        '--status',
        'READY',
        '--meta',
        `githubCommitSha=${sha}`,
        '--json',
      ], { capture: true, scope, token })
      primaryDeployment = selectReadyProductionDeployment(JSON.parse(deploymentListOutput), sha)
      break
    } catch (error) {
      if (error?.code === 'EINVAL' || error?.code === 'ENOENT') throw error
      lastResolutionError = error
      if (attempt < retryAttempts) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, retryDelayMs))
      }
    }
  }

  if (!primaryDeployment) {
    throw lastResolutionError ?? new Error(`Unable to resolve the primary deployment for ${sha}.`)
  }

  console.log(`Deploying ${sha.slice(0, 12)} to ${guatemalaProject}...`)
  const guatemalaOutput = runVercel([
    'deploy',
    '--prod',
    '--yes',
    '--project',
    guatemalaProject,
    '--env',
    `REWARDS_SOURCE_COMMIT=${sha}`,
    '--meta',
    `rewardsSourceCommit=${sha}`,
  ], { capture: true, scope, token })
  const guatemalaDeployment = extractDeploymentUrl(guatemalaOutput)

  for (const alias of deploymentDefaults.aliases) {
    console.log(`Pointing ${alias} to ${primaryDeployment}...`)
    runVercel(['alias', 'set', primaryDeployment, alias], { scope, token })
  }

  const summary = {
    completedAtUtc: new Date().toISOString(),
    sha,
    scope,
    primaryProject,
    primaryDeployment,
    guatemalaProject,
    guatemalaDeployment,
    aliases: deploymentDefaults.aliases.map((hostname) => ({ hostname, deployment: primaryDeployment })),
  }
  await writeSummary(options.output, summary)
  return summary
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const summary = await deployTenantSites(options)
  console.log(JSON.stringify(summary, null, 2))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
