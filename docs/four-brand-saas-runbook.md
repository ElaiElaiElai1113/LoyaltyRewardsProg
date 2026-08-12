# Four-Brand SaaS Runbook

## Environment

1. Run `npx supabase projects list` and confirm the intended hosted project.
2. Run `npx supabase link --project-ref <project-ref>` only when the repository is not already linked.
3. Copy `.env.example` to `.env`, configure the Supabase keys, and run `npm run test:e2e:doctor`.
4. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run test:e2e:hosted-safe`.
5. Run `npx supabase migration list` before proposing any hosted schema change.

For a complete local evidence bundle, run:

```text
npm run ops:launch:gates
```

Add `-- --hosted` only in an environment configured for hosted security tests. Reports are written to `artifacts/launch-evidence` with the commit SHA, gate results, durations, output tails, and a report SHA-256.

Authenticated workflow commands fail immediately with a readiness report when Supabase is not configured. The public `npm run test:e2e` command remains usable without backend credentials.

## Scheduled Database Backup

The scheduled workflow exports `roles.sql`, `schema.sql`, and `data.sql` separately. The data export uses `--data-only --use-copy`; a default `supabase db dump` is schema-only. The workflow validates the three files, verifies their SHA-256 checksums, packages them with a manifest, and uploads only the passphrase-encrypted `.tar.gz.gpg` archive and its ciphertext checksum. Keep `BACKUP_ENCRYPTION_PASSPHRASE` in a protected GitHub secret and in an approved recovery vault, never in source control or workflow output.

Recover only into a disposable, compatible Supabase/Postgres target first:

```sh
sha256sum -c rewards-<run>.tar.gz.gpg.sha256
gpg --decrypt --output rewards-<run>.tar.gz rewards-<run>.tar.gz.gpg
tar -xzf rewards-<run>.tar.gz
cd rewards-<run>
sha256sum -c SHA256SUMS
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file roles.sql \
  --file schema.sql \
  --command 'SET session_replication_role = replica' \
  --file data.sql \
  --dbname "$RESTORE_DATABASE_URL"
```

Compare key table row counts and application workflows before approving any production recovery. Custom login-role passwords, Storage object contents, Edge Functions, JWT/API secrets, OAuth/SMTP settings, and domains are not contained in the SQL bundle and require separate recovery procedures.

## Hosted Database Change

1. Run `npm run ops:supabase:backup` and retain the `.dump` and `.manifest.json` files together.
2. Run `npm run ops:supabase:backup:validate -- -BackupFile <dump-path>`.
3. Run `npm run ops:supabase:reconcile` and retain the pre-change report.
   Set `SUPABASE_DB_PASSWORD` only in a protected CI secret when a noninteractive run is required. Local runs continue to prompt securely.
4. Run `supabase/preflight/tenant-launch-preflight.sql` read-only and resolve every reported tenant integrity issue.
5. Review pending migration SQL and request explicit approval naming the hosted project and migrations.
6. Apply only after approval, then rerun migration status, reconciliation, unit tests, and hosted-safe Playwright.
7. Never pass the database password on the command line or store it in the repository.

Emergency containment SQL is stored under `supabase/rollback-guides`. These files preserve tenant, financial, import, and audit records and are intentionally outside the migrations directory.

## Tenant Migration

1. Export one tenant using the shape documented in `tenant-import-template.json`.
2. Run `npm run validate:tenant-import -- export.json`.
3. Record source counts and the balance, transaction, and outstanding gift-card totals.
4. Import into a draft program only. Never import directly into an active program.
5. Re-run reconciliation queries and investigate every mismatch.
6. Test member, business, program-admin, agreements, rewards, referrals, and gift-card workflows.
7. Verify the custom domain, email sender, legal copy, currency, timezone, and map center.
8. Run in parallel with the old site before changing DNS.

## Rollback

1. Keep the previous site and database read-only during the parallel period.
2. Lower DNS TTL before cutover.
3. If reconciliation or smoke tests fail, restore DNS to the previous deployment.
4. Suspend the affected program to prevent writes.
5. Export and reconcile all post-import writes before correcting imported records.
6. Restore a database archive only into a disposable environment first and validate it.
7. Never delete financial records as a rollback mechanism.

## Plan administration

Online payment processing is not part of this platform. Program provisioning,
platform subdomains, configuration, and access administration are managed by
authorized operations staff.

1. Approve plan entitlements and program limits before assignment.
2. Record the operator, reason, evidence, and effective date for every plan change.
3. Test activation, suspension, renewal reminders, cancellation, and cross-tenant isolation.
4. Keep card and payment credentials out of platform forms, logs, and support records.

## Launch Gate

- Full migrations apply cleanly.
- Cross-program access tests pass.
- No skipped authenticated Playwright workflows.
- Source and destination reconciliation totals match.
- Backups and restore procedures have been tested.
- Domain, TLS, email, monitoring, and alerting are active.
