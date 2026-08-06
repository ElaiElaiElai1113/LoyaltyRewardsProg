import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const REQUIRED_BACKUP_FILES = ['roles.sql', 'schema.sql', 'data.sql']
const PROGRAMS_TABLE_PATTERN = /\bcreate\s+table(?:\s+if\s+not\s+exists)?\s+(?:"public"|public)\.(?:"programs"|programs)(?=\s|\()/i
const PROGRAMS_COPY_PATTERN = /\bcopy\s+(?:"public"|public)\.(?:"programs"|programs)(?=\s|\()/i

function requiredMetadata(value, label) {
  const normalized = String(value ?? '').trim()
  if (!normalized) throw new Error(`Missing backup metadata: ${label}.`)
  return normalized
}

function sha256(content) {
  return createHash('sha256').update(content).digest('hex')
}

async function readRequiredBackupFile(directory, filename) {
  const file = resolve(directory, filename)
  let content

  try {
    content = await readFile(file)
  } catch {
    throw new Error(`Missing required backup file: ${filename}.`)
  }

  if (!content.toString('utf8').trim()) {
    throw new Error(`Required backup file is empty: ${filename}.`)
  }

  return {
    filename,
    content,
    bytes: content.byteLength,
    sha256: sha256(content),
  }
}

/**
 * Validate one scheduled logical-backup directory and write its integrity metadata.
 * Only explicitly allowlisted operational metadata is included in the manifest.
 */
export async function validateScheduledBackup(backupDirectory, metadata = {}) {
  if (!backupDirectory) throw new Error('A backup directory is required.')

  const directory = resolve(backupDirectory)
  const directoryStat = await stat(directory).catch(() => null)
  if (!directoryStat?.isDirectory()) throw new Error('Backup directory does not exist.')

  const files = await Promise.all(
    REQUIRED_BACKUP_FILES.map((filename) => readRequiredBackupFile(directory, filename)),
  )
  const filesByName = new Map(files.map((file) => [file.filename, file]))
  const schema = filesByName.get('schema.sql').content.toString('utf8')
  const data = filesByName.get('data.sql').content.toString('utf8')

  if (!PROGRAMS_TABLE_PATTERN.test(schema)) {
    throw new Error('schema.sql does not contain CREATE TABLE public.programs.')
  }
  if (!PROGRAMS_COPY_PATTERN.test(data)) {
    throw new Error('data.sql does not contain COPY public.programs.')
  }

  const manifest = {
    projectRef: requiredMetadata(metadata.projectRef ?? process.env.PROJECT_REF, 'project ref'),
    runId: requiredMetadata(metadata.runId ?? process.env.GITHUB_RUN_ID, 'run id'),
    commit: requiredMetadata(metadata.commit ?? process.env.GITHUB_SHA, 'commit'),
    timestamp: requiredMetadata(metadata.timestamp ?? new Date().toISOString(), 'timestamp'),
    supabaseCliVersion: requiredMetadata(
      metadata.supabaseCliVersion ?? process.env.SUPABASE_CLI_VERSION,
      'Supabase CLI version',
    ),
    files: files.map(({ filename, bytes, sha256: digest }) => ({
      filename,
      bytes,
      sha256: digest,
    })),
  }
  const checksumFile = files.map((file) => `${file.sha256}  ${file.filename}`).join('\n') + '\n'

  await Promise.all([
    writeFile(resolve(directory, 'SHA256SUMS'), checksumFile, 'utf8'),
    writeFile(resolve(directory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
  ])

  return manifest
}

async function runCli() {
  const backupDirectory = process.argv[2]

  try {
    const manifest = await validateScheduledBackup(backupDirectory)
    console.log(JSON.stringify({
      passed: true,
      backup: basename(resolve(backupDirectory)),
      files: manifest.files.length,
      bytes: manifest.files.reduce((total, file) => total + file.bytes, 0),
      integrityFiles: ['SHA256SUMS', 'manifest.json'],
    }))
  } catch (error) {
    console.error(JSON.stringify({
      passed: false,
      error: error instanceof Error ? error.message : 'Backup validation failed.',
    }))
    process.exitCode = 1
  }
}

const invokedScript = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null
if (invokedScript === import.meta.url) await runCli()
