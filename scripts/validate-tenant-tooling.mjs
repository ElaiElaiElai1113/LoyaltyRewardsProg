import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const fixture = JSON.parse(await readFile(resolve('tests/fixtures/tenant-import-valid.json'), 'utf8'))
const directory = await mkdtemp(join(tmpdir(), 'rewards-tenant-tools-'))
const cases = [
  ['valid', fixture, 0],
  ['duplicate-email', { ...fixture, users: [...fixture.users, { ...fixture.users[0], id: 'user-duplicate' }] }, 1],
  ['unknown-user', { ...fixture, balances: [{ ...fixture.balances[0], userId: 'missing' }] }, 1],
  ['negative-balance', { ...fixture, balances: [{ ...fixture.balances[0], points: -1 }] }, 1],
  ['unknown-business', { ...fixture, transactions: [{ ...fixture.transactions[0], businessId: 'missing' }] }, 1],
]
const results = []
for (const [name, data, expected] of cases) {
  const path = join(directory, `${name}.json`)
  await writeFile(path, JSON.stringify(data))
  const result = spawnSync(process.execPath, ['scripts/validate-tenant-import.mjs', path], { encoding: 'utf8' })
  results.push({ name, passed: result.status === expected, expected, actual: result.status })
}
const reconcileMismatch = { ...fixture, balances: [{ ...fixture.balances[0], points: fixture.balances[0].points + 1 }] }
const mismatchPath = join(directory, 'mismatch.json')
await writeFile(mismatchPath, JSON.stringify(reconcileMismatch))
const reconcile = spawnSync(process.execPath, ['scripts/reconcile-tenant-exports.mjs', resolve('tests/fixtures/tenant-import-valid.json'), mismatchPath, join(directory, 'report.json')])
results.push({ name: 'reconciliation-mismatch', passed: reconcile.status === 1, expected: 1, actual: reconcile.status })

console.log(JSON.stringify({ passed: results.every((result) => result.passed), results }, null, 2))
process.exit(results.every((result) => result.passed) ? 0 : 1)
