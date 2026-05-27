export const e2eBaseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175'

export const e2ePassword = process.env.E2E_PASSWORD ?? 'demo1234'

export const workflowAuthEnabled =
  process.env.E2E_AUTH_ENABLED === 'true' ||
  process.env.npm_lifecycle_event === 'test:e2e:workflows' ||
  process.env.npm_lifecycle_event === 'test:launch' ||
  process.env.npm_lifecycle_event === 'test:referrals' ||
  process.env.npm_lifecycle_event === 'test:onboarding' ||
  process.env.npm_lifecycle_event === 'test:gift-cards' ||
  process.env.npm_lifecycle_event === 'test:rewards'

export const e2eAccounts = {
  customer: process.env.E2E_CUSTOMER_EMAIL ?? 'customer@medellin.test',
  unverifiedCustomer: process.env.E2E_UNVERIFIED_CUSTOMER_EMAIL ?? 'unverified@medellin.test',
  businessStaff: process.env.E2E_BUSINESS_STAFF_EMAIL ?? 'staff@velvetbrew.test',
  businessOwner: process.env.E2E_BUSINESS_OWNER_EMAIL ?? 'owner@velvetbrew.test',
  admin: process.env.E2E_ADMIN_EMAIL ?? 'admin@medellin.test',
} as const
