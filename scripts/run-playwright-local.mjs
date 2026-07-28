import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

import { printE2eReadiness } from './check-e2e-readiness.mjs'

const host = '127.0.0.1'
const port = Number(process.env.E2E_PORT ?? 5177)
const baseUrl = `http://${host}:${port}`
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const lifecycleEvent = process.env.npm_lifecycle_event ?? ''
const offlineRun = lifecycleEvent === 'test:e2e:ci'
if (offlineRun) {
  process.env.VITE_SUPABASE_URL = ''
  process.env.VITE_SUPABASE_ANON_KEY = ''
}
const authenticatedLifecycleCommands = new Set([
  'test:e2e:hosted-safe',
  'test:e2e:workflows',
  'test:e2e:acceptance',
  'test:launch',
  'test:referrals',
  'test:onboarding',
  'test:gift-cards',
  'test:rewards',
  'test:agreements',
])
const authRequested =
  process.env.E2E_AUTH_ENABLED === 'true' ||
  authenticatedLifecycleCommands.has(lifecycleEvent)

if (!printE2eReadiness({ requireAuth: authRequested })) {
  process.exit(1)
}

const server = await createServer({
  server: {
    host,
    port,
    strictPort: true,
  },
})

let child
let shuttingDown = false

async function shutdown(code = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  if (child && child.exitCode === null && !child.killed) {
    child.kill('SIGTERM')
  }

  await server.close()
  process.exit(code)
}

process.on('SIGINT', () => void shutdown(130))
process.on('SIGTERM', () => void shutdown(143))

try {
  await server.listen()

  const playwrightCli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url))
  const forwardedArgs = process.argv.slice(2)

  child = spawn(
    process.execPath,
    [
      playwrightCli,
      'test',
      ...forwardedArgs,
      '--config=playwright.local.config.ts',
    ],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        E2E_BASE_URL: baseUrl,
      },
      stdio: 'inherit',
    },
  )

  child.on('close', (code) => {
    void shutdown(code ?? 1)
  })
} catch (error) {
  console.error(error)
  await shutdown(1)
}
