# Four-brand SaaS foundation release

Release date: 2026-07-29
Merged commit: `d430e59076b8aee57d7ff8b82a1ebe23dc7477fc`
Hosted project: Rewards Program (`retfuxpfstatpdsunkgj`)
Production origin: `https://loyalty-rewards-prog.vercel.app`

## Included

- Shared tenant identity, membership, branding, domain, entitlement, administration, and onboarding foundations.
- Platform and tenant administration consoles.
- Tenant-aware public routes, links, metadata, email templates, storage paths, and browser state.
- Migration, reconciliation, audit, backup, restore, monitoring, rollback, and launch tooling.
- Guatemala Rewards, Synergize, and Davao Rewards migration packages.
- Neutral Android and iOS application wrappers and release-readiness validation.

Stripe Billing is intentionally deferred.

## Verification

- GitHub frontend quality, migration, and security checks passed on the merged commit.
- Vercel deployed the merged commit successfully.
- Production smoke checks passed for `/api/health`, `/`, `/signin`, `/business`, and `/guide`.
- The production health endpoint reported `ready`, a reachable database, and version `d430e59076b8`.
- All 12 consolidated launch gates passed, including unit, legacy regression, Playwright, tenant-console, load, typecheck, lint, build, and migration-contract checks.
- All four hosted adversarial tenant-isolation checks passed.
- Operations, tenant migration package, mobile wrapper, and migration-release validators passed.
- Email validation reports Medellin and Guatemala ready; Synergize and Davao remain pending owner-controlled SMTP and DNS inputs.
- The immutable Vercel deployment URL is protected and returned `401`; post-deployment verification now prefers the public `PRODUCTION_URL` repository variable.

## Approval-gated

The following migrations are committed but have not been applied to the hosted project:

- `supabase/migrations/20260728000000_tenant_limits_and_storage_isolation.sql`
- `supabase/migrations/20260729000000_program_state_usage_and_audit.sql`
- `supabase/migrations/20260730000000_domain_team_and_import_operations.sql`

Applying these migrations requires explicit approval naming project `retfuxpfstatpdsunkgj` and all three files. Authenticated write acceptance tests must run after migration and QA account confirmation.

## Owner-controlled inputs

- Hosted database password for read-only preflight and backup operations.
- Guatemala, Synergize, and Davao source exports and approved reconciliation totals.
- Final tenant domains, DNS access, SMTP configuration, legal content, branding, and map inputs.
- GitHub operations secrets and production service credentials.
- Disposable restore target.
- Apple and Google store accounts, signing identities, and Android SDK license acceptance.
- Domain cutover approval after parallel-run reconciliation.
