import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  deploymentDefaults,
  extractDeploymentUrl,
  normalizeCommitSha,
  parseArguments,
  selectReadyProductionDeployment,
} from './deploy-tenant-sites.mjs'

const sha = '439a62543f0ec08f92b66a7bb3bfbc8200618fb3'

test('selects the newest ready production deployment for the exact commit', () => {
  const selected = selectReadyProductionDeployment({
    deployments: [
      {
        url: 'loyalty-rewards-prog-old-team.vercel.app',
        state: 'READY',
        target: 'production',
        createdAt: 1,
        meta: { githubCommitSha: sha },
      },
      {
        url: 'loyalty-rewards-prog-new-team.vercel.app',
        state: 'READY',
        target: 'production',
        createdAt: 2,
        meta: { githubCommitSha: sha },
      },
      {
        url: 'loyalty-rewards-prog-preview-team.vercel.app',
        state: 'READY',
        target: null,
        createdAt: 3,
        meta: { githubCommitSha: sha },
      },
    ],
  }, sha)

  assert.equal(selected, 'https://loyalty-rewards-prog-new-team.vercel.app')
})

test('fails closed when no exact production deployment exists', () => {
  assert.throws(
    () => selectReadyProductionDeployment({ deployments: [] }, sha),
    /No ready production deployment matches commit/,
  )
})

test('extracts deployment URLs from JSON and plain CLI output', () => {
  assert.equal(
    extractDeploymentUrl(JSON.stringify({ deployment: { url: 'https://guatemala-rewards-build.vercel.app' } })),
    'https://guatemala-rewards-build.vercel.app',
  )
  assert.equal(
    extractDeploymentUrl('Production: https://guatemala-rewards-plain.vercel.app'),
    'https://guatemala-rewards-plain.vercel.app',
  )
})

test('validates arguments and preserves the audited alias set', () => {
  assert.equal(normalizeCommitSha(sha.toUpperCase()), sha)
  assert.deepEqual(parseArguments(['--sha', sha, '--dry-run', '--output', 'report.json']), {
    sha,
    dryRun: true,
    output: 'report.json',
  })
  assert.deepEqual(deploymentDefaults.aliases, [
    'pinas-rewards.vercel.app',
    'wondertown-rewards.vercel.app',
  ])
  assert.throws(() => normalizeCommitSha('439a625'), /full 40-character Git commit SHA/)
})

test('health version fallback is explicitly supplied to the Guatemala deployment', async () => {
  const source = await readFile(new URL('./deploy-tenant-sites.mjs', import.meta.url), 'utf8')
  assert.match(source, /REWARDS_SOURCE_COMMIT=\$\{sha\}/)
})
