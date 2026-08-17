import { defineConfig, devices } from '@playwright/test'

import { e2eBaseUrl } from './tests/e2e/helpers/env.js'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: e2eBaseUrl,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'critical-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'critical-webkit-iphone',
      use: { ...devices['iPhone 13'] },
    },
  ],
})
