import { defineConfig, devices } from '@playwright/test'

import { e2eBaseUrl } from './tests/e2e/helpers/env.js'

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: [
    ...(process.env.E2E_INCLUDE_MEDELLIN_DEMO === 'true' ? [] : ['medellin-demo.spec.ts']),
    ...(process.env.E2E_INCLUDE_REWARDME_RELEASE_MODE === 'true'
      ? []
      : ['rewardme-release-mode.spec.ts']),
  ],
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [['list']],
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
