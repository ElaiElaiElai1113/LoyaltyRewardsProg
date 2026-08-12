# RewardMe browser QA workflow

RewardMe QA uses the existing Supabase test accounts and browser tests. It does
not require a local database runtime and must never reset or seed the production
project during routine verification.

## Public and offline-safe checks

These commands start the site locally and exercise public routes, responsive
layouts, accessibility, tenant branding, and release-mode credential hiding:

```powershell
npm run test:e2e:ci
npm run test:e2e:quality
npm run test:e2e:rewardme-release-mode
npm run test:responsive
```

`test:e2e:ci` deliberately clears browser Supabase variables, so it can verify
that public pages fail safely without relying on a live account session.

## Published RewardMe account checks

The sign-in pages currently show four temporary QA accounts. To verify that each
credential reaches the correct live portal without changing fixture data, run:

```powershell
npm run test:e2e:rewardme-accounts
```

This check covers the member, business owner, business staff, and platform
administrator roles against the published RewardMe site. It does not require a
service-role key.

## Hosted-safe database checks

Use the following only when the browser Supabase values point to the configured
RewardMe QA project:

```powershell
npm run test:e2e:rewardme-safe
```

The suite verifies authentication, program isolation, balances, and mobile
login behavior. Do not set `E2E_ALLOW_HOSTED_WORKFLOWS=true` for the production
project; mutation-heavy acceptance suites belong in a separately authorized QA
project.

## Production fixture maintenance

The existing fixture provisioner is an exceptional maintenance tool, not part
of routine QA. It requires explicit `-Apply`, obtains project values without
writing them to disk, and should run only during an approved maintenance window:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/provision-rewardme-production-qa.ps1 -Apply -RunAuthenticatedChecks
```

Before public launch, set `VITE_SHOW_PUBLIC_QA_CREDENTIALS=false`, redeploy, run
`npm run test:e2e:rewardme-release-mode`, and rotate or disable all published QA
accounts.
