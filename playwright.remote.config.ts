import { defineConfig, devices } from '@playwright/test'

import { e2eBaseUrl } from './tests/e2e/helpers/env.js'

export default defineConfig({
  globalSetup: './scripts/verify-hosted-acceptance.mjs',
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['./scripts/required-acceptance-reporter.mjs']],
  use: {
    baseURL: e2eBaseUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
