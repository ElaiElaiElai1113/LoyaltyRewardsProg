# Four-Brand SaaS Runbook

## Environment

1. Run `npx supabase projects list` and confirm the intended hosted project.
2. Run `npx supabase link --project-ref <project-ref>` only when the repository is not already linked.
3. Copy `.env.example` to `.env`, configure the Supabase keys, and run `npm run test:e2e:doctor`.
4. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run test:e2e:hosted-safe`.
5. Run `npx supabase migration list` before proposing any hosted schema change.

Authenticated workflow commands fail immediately with a readiness report when Supabase is not configured. The public `npm run test:e2e` command remains usable without backend credentials.

## Hosted Database Change

1. Run `npm run ops:supabase:backup` and retain the `.dump` and `.manifest.json` files together.
2. Run `npm run ops:supabase:backup:validate -- -BackupFile <dump-path>`.
3. Run `npm run ops:supabase:reconcile` and retain the pre-change report.
4. Review pending migration SQL and request explicit approval naming the hosted project and migrations.
5. Apply only after approval, then rerun migration status, reconciliation, unit tests, and hosted-safe Playwright.
6. Never pass the database password on the command line or store it in the repository.

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

## Stripe

Stripe is deferred. Program provisioning, platform subdomains, configuration, and access administration must remain usable without it.

1. Register `/api/stripe-webhook` for Checkout and subscription lifecycle events.
2. Confirm signature verification and idempotent event claims in staging.
3. Test success, cancellation, past-due, unpaid, upgrade, downgrade, and cancellation-at-period-end.
4. Confirm SaaS billing never updates a member rewards membership.

## Launch Gate

- Full migrations apply cleanly.
- Cross-program access tests pass.
- No skipped authenticated Playwright workflows.
- Source and destination reconciliation totals match.
- Backups and restore procedures have been tested.
- Domain, TLS, email, monitoring, and alerting are active.
