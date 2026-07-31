import { readFile } from 'node:fs/promises'

const path = new URL('../docs/tenant-email-redirect-matrix.json', import.meta.url)
const matrix = JSON.parse(await readFile(path, 'utf8'))
const allowedStatuses = new Set(['ready', 'pending'])
const requiredPaths = ['/auth/confirm', '/auth/reset-password', '/accept-invitation']
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

  if (program.status === 'ready' && !program.senderEmail) {
    throw new Error(`${program.slug} is marked ready without a sender email.`)
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
}

const ready = matrix.programs.filter((program) => program.status === 'ready').length
console.log(`Email configuration valid: ${ready} ready, ${matrix.programs.length - ready} pending.`)
