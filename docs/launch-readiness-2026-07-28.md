# Four-Brand SaaS Launch Readiness

Assessment date: 2026-07-28  
Hosted project: Rewards Program (`retfuxpfstatpdsunkgj`)  
Branch: `agent/four-brand-saas-foundation`

## Completed

- The repository is linked to project `retfuxpfstatpdsunkgj`.
- Hosted migration history is synchronized through `20260726000000`.
- The three expected approval-gated migrations are pending:
  - `20260728000000_tenant_limits_and_storage_isolation.sql`
  - `20260729000000_program_state_usage_and_audit.sql`
  - `20260730000000_domain_team_and_import_operations.sql`
- Backup `rewards-program-20260726-013211.dump` is structurally valid.
- Backup size is 702,856 bytes with 968 archive entries.
- Backup SHA-256 is `BE478D6061E3EEC60C3BF95327034E57CED36ADB03CDD9BCED6096D416693139`.
- Tenant fixture import validation, failure-case testing, and branding audit pass.
- Restore rehearsal tooling can parse and validate the backup and manifest.
- No restore was attempted against the hosted database.

## Hosted Database Blockers

- Applying migrations requires explicit approval naming the hosted project and each migration file.
- Fresh financial reconciliation requires the Supabase database password at the interactive prompt. The attempted read-only reconciliation timed out without credentials and produced no report.
- Subscription, entitlement, verification-path, and active-administrator preflight counts depend on that same database connection.
- `VITE_TENANT_STATE_RPC_ENABLED` must remain `false` until migration `20260729000000` is applied and verified.

## Environment Blockers

The current shell does not contain production deployment values for Supabase browser/server keys, public site URL, SMTP, or service-role access. Stripe remains intentionally deferred. Run `npm run ops:release:validate -- --production` inside the configured deployment environment before release.

Monitoring forwarding remains inactive until `VITE_MONITORING_ENDPOINT` is configured. Structured browser logging works without a provider.

## Restore Status

The backup and manifest pass preflight. A genuine restore is blocked because there is no disposable PostgreSQL or Supabase target and `RESTORE_DATABASE_URL` is not configured. Production is never an acceptable rehearsal target.

## Domain Status

### Guatemala Rewards

- HTTPS root responds successfully.
- Tenant title, favicon, and manifest references are present.
- Manifest identifies Guatemala Rewards.
- `/api/health` returns HTML instead of the expected JSON health response.
- DNS ownership and record state still require confirmation by the domain owner.

### Davao Rewards

- `davaorewards.com` is not currently reachable by the readiness checker.
- HTTPS, metadata, manifest, and health checks remain blocked.

### Synergize

- `synergize.rewardsplatform.app` is not currently reachable.
- A final primary domain has not been approved.

## External Inputs Still Required

- Exact migration approval
- Database password for pre/post reconciliation
- Guatemala, Synergize, and Davao source exports
- Final branding assets, legal documents, map centers, sender addresses, and business rules
- DNS/domain account access
- Production deployment environment variables
- Monitoring provider endpoint
- Disposable restore target

## Required Order

1. Supply database access and run fresh reconciliation.
2. Approve and apply the three migrations in order.
3. Reconcile again and run hosted authenticated and adversarial suites.
4. Enable the tenant-state RPC flag and deploy the exact validated commit.
5. Repair and verify domains, health endpoints, email links, and monitoring.
6. Import each remaining tenant into draft state and reconcile before cutover.
