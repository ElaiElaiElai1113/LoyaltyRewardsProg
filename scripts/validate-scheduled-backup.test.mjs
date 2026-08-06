import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { validateScheduledBackup } from './validate-scheduled-backup.mjs'

const metadata = {
  projectRef: 'test-project-ref',
  runId: '123456',
  commit: 'abcdef1234567890',
  timestamp: '2026-08-06T00:00:00.000Z',
  supabaseCliVersion: '2.103.0',
}

async function createBackup(t, overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'scheduled-backup-'))
  t.after(() => rm(directory, { recursive: true, force: true }))

  const files = {
    'roles.sql': 'CREATE ROLE authenticated;\n',
    'schema.sql': 'CREATE TABLE IF NOT EXISTS "public"."programs" (id uuid PRIMARY KEY);\n',
    'data.sql': 'COPY "public"."programs" (id) FROM stdin;\n\\.\n',
    ...overrides,
  }

  await Promise.all(
    Object.entries(files)
      .filter(([, content]) => content !== null)
      .map(([filename, content]) => writeFile(join(directory, filename), content, 'utf8')),
  )
  return directory
}

test('validates a complete scheduled backup and writes integrity files', async (t) => {
  const directory = await createBackup(t)
  const manifest = await validateScheduledBackup(directory, metadata)

  assert.equal(manifest.files.length, 3)
  assert.deepEqual(manifest.files.map((file) => file.filename), ['roles.sql', 'schema.sql', 'data.sql'])
  assert.match(await readFile(join(directory, 'SHA256SUMS'), 'utf8'), /  roles\.sql\n/)
  assert.deepEqual(JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8')), manifest)
})

test('rejects a data dump without a public.programs COPY section', async (t) => {
  const directory = await createBackup(t, {
    'data.sql': '-- schema-only output accidentally supplied as data\n',
  })

  await assert.rejects(
    validateScheduledBackup(directory, metadata),
    /data\.sql does not contain COPY public\.programs/,
  )
})

test('rejects a backup with a missing required file', async (t) => {
  const directory = await createBackup(t, { 'roles.sql': null })

  await assert.rejects(
    validateScheduledBackup(directory, metadata),
    /Missing required backup file: roles\.sql/,
  )
})

test('records exact checksum metadata without secret fields', async (t) => {
  const directory = await createBackup(t)
  await validateScheduledBackup(directory, metadata)

  const manifest = JSON.parse(await readFile(join(directory, 'manifest.json'), 'utf8'))
  const checksumLines = (await readFile(join(directory, 'SHA256SUMS'), 'utf8')).trim().split('\n')

  assert.deepEqual(
    Object.keys(manifest),
    ['projectRef', 'runId', 'commit', 'timestamp', 'supabaseCliVersion', 'files'],
  )
  assert.deepEqual(
    {
      projectRef: manifest.projectRef,
      runId: manifest.runId,
      commit: manifest.commit,
      timestamp: manifest.timestamp,
      supabaseCliVersion: manifest.supabaseCliVersion,
    },
    metadata,
  )

  for (const file of manifest.files) {
    const content = await readFile(join(directory, file.filename))
    const digest = createHash('sha256').update(content).digest('hex')
    assert.equal(file.bytes, content.byteLength)
    assert.equal(file.sha256, digest)
    assert.ok(checksumLines.includes(`${digest}  ${file.filename}`))
  }

  const serialized = JSON.stringify(manifest).toLowerCase()
  assert.doesNotMatch(serialized, /password|access[_-]?token|passphrase|secret/)
})
