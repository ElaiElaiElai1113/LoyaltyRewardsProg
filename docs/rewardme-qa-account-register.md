# RewardMe private QA account register

RewardMe production QA uses isolated accounts for the member, business-owner,
business-staff, and platform-administrator journeys. Their identifiers and
password are private release credentials stored in the repository's encrypted
GitHub Actions secrets. The browser bundle and sign-in pages must never contain
them.

The accounts are attached only to the designated RewardMe QA partner and use
non-customer fixture data. Password rotation is performed through the Supabase
Admin API; never update password hashes with database SQL.

## Provisioning and verification

Set a private 12-or-more-character `E2E_PASSWORD` in the process environment or
pass `-QaPassword`, then run the approved wrapper on the authorized Windows
release workstation:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/provision-rewardme-production-qa.ps1 -Apply -RunAuthenticatedChecks
```

The wrapper retrieves the project API keys into process memory, provisions the
isolated fixtures, verifies the hosted sign-in and tenant-isolation contracts,
restores the prior environment, and never writes or prints either server key or
the QA password. Omit `-Apply` for a read-only key-availability preflight.

Production release mode is checked with:

```powershell
npm run test:e2e:rewardme-release-mode
```

The production build budget also fails if a QA email or legacy shared password
literal is present in deployable HTML, JavaScript, or CSS.

## Rotation policy

1. Keep `VITE_SHOW_PUBLIC_QA_CREDENTIALS=false` in every production target.
2. Rotate all QA passwords after any suspected disclosure and after personnel
   with secret access leave the project.
3. Run the private authenticated role, tenant-isolation, and responsive checks.
4. Archive only clearly labelled QA catalog fixtures; never delete financial or
   real customer records as part of QA cleanup.
