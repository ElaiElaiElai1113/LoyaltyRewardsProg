# Four-Brand SaaS Runbook

## Environment

1. Start Docker Desktop and run `npx supabase db reset`.
2. Copy `.env.example` to `.env`, configure the keys, and run `npm run test:e2e:doctor`.
3. Run `npm run typecheck`, `npm run lint`, `npm run test:unit`, and `npm run test:e2e:workflows`.
4. Configure staging Supabase, Stripe test keys, the service-role key, and the Stripe webhook.
5. Populate `subscription_plans.stripe_price_id` with test-mode prices.

Authenticated workflow commands fail immediately with a readiness report when Supabase is not configured. The public `npm run test:e2e` command remains usable without backend credentials.

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
4. Suspend the new program to prevent writes.
5. Export all post-import writes before correcting or removing imported records.
6. Never delete financial records as a rollback mechanism.

## Stripe

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
