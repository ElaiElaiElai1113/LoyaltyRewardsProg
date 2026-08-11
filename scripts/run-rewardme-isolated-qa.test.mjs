import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const script = await readFile('scripts/run-rewardme-isolated-qa.ps1', 'utf8')
const config = await readFile('supabase/config.toml', 'utf8')

test('isolated QA runner fails closed and targets only the disposable local stack', () => {
  assert.match(script, /Get-Command 'docker\.exe'/)
  assert.match(script, /if \(-not \$Apply\)/)
  assert.match(script, /'db', 'reset', '--local', '--yes'/)
  assert.match(script, /Refusing non-local Supabase URL/)
  assert.match(script, /'start', '--yes'\) -SuppressOutput/)
  assert.match(script, /'http:\/\/pinas\.localhost:5177\/reset-password'/)
  assert.match(script, /'test:e2e:workflows'/)
  assert.match(script, /tenant-authenticated-smoke\.spec\.ts/)
  assert.match(script, /supabase stop --no-backup/)
  assert.doesNotMatch(script, /--linked/)
})

test('local authentication allows the exact tenant QA callback origins', () => {
  for (const tenant of ['medellin', 'guatemala', 'pinas', 'synergize', 'wondertown']) {
    assert.match(config, new RegExp(`http://${tenant}\\.localhost:5177/\\*\\*`))
  }
})
