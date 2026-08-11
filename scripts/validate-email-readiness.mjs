import { readFile } from 'node:fs/promises'

const path = new URL('../docs/tenant-email-redirect-matrix.json', import.meta.url)
const matrix = JSON.parse(await readFile(path, 'utf8'))
const allowedStatuses = new Set(['ready', 'pending', 'disabled'])
const requiredPaths = ['/auth/confirm', '/reset-password', '/accept-invitation']
const router = await readFile(new URL('../src/routes/router.tsx', import.meta.url), 'utf8')
const hostnames = new Set()

if (matrix.schemaVersion !== 1 || !Array.isArray(matrix.programs) || matrix.programs.length < 4) {
  throw new Error('Email readiness matrix has an invalid schema.')
}

for (const program of matrix.programs) {
  if (!/^[a-z0-9-]+$/.test(program.slug) || !allowedStatuses.has(program.status)) {
    throw new Error(`Invalid program entry: ${JSON.stringify(program)}`)
  }
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(program.hostname) || hostnames.has(program.hostname)) {
    throw new Error(`Invalid or duplicate hostname: ${program.hostname}`)
  }
  hostnames.add(program.hostname)

  if ('monitor' in program && typeof program.monitor !== 'boolean') {
    throw new Error(`${program.slug} monitor must be a boolean when configured.`)
  }
  if ('publicHostname' in program && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(program.publicHostname)) {
    throw new Error(`${program.slug} public hostname is invalid.`)
  }

  if (program.status === 'ready' && !program.senderEmail) {
    throw new Error(`${program.slug} is marked ready without a sender email.`)
  }
  if (program.status === 'disabled' && (program.senderEmail || !program.reason?.trim())) {
    throw new Error(`${program.slug} must have no sender and include a reason when email is disabled.`)
  }

  const senderDomain = program.senderEmail?.split('@')[1] ?? null
  if (senderDomain !== null && senderDomain !== program.hostname) {
    throw new Error(`${program.slug} sender must use its configured hostname.`)
  }
}

for (const requiredPath of requiredPaths) {
  if (!matrix.redirectPaths.includes(requiredPath)) {
    throw new Error(`Missing required authentication redirect: ${requiredPath}`)
  }
  if (!router.includes(`path: '${requiredPath}'`)) {
    throw new Error(`Authentication redirect has no application route: ${requiredPath}`)
  }
}

if (matrix.redirectPaths.includes('/auth/reset-password')) {
  throw new Error('Remove the obsolete /auth/reset-password redirect; the application uses /reset-password.')
}

const ready = matrix.programs.filter((program) => program.status === 'ready').length
const pending = matrix.programs.filter((program) => program.status === 'pending').length
const disabled = matrix.programs.filter((program) => program.status === 'disabled').length
console.log(`Email configuration valid: ${ready} ready, ${pending} pending, ${disabled} disabled.`)
