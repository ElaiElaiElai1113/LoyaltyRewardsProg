# Production Release Checklist

## Before Release

- [ ] Identify commit SHA, release owner, deployment owner, and rollback owner.
- [ ] Confirm `git status` contains no unintended changes.
- [ ] Run typecheck, lint, unit tests, production build, bundle budget, and deterministic Playwright.
- [ ] Run tenant import tooling regression and branding audit.
- [ ] Run `npm run ops:release:validate -- --production` in the deployment environment.
- [ ] Validate the latest backup and retain its manifest.
- [ ] Record pending and applied Supabase migrations.
- [ ] Obtain explicit database approval when applicable.

## Deployment

- [ ] Deploy the exact validated commit.
- [ ] Record deployment URL and immutable version identifier.
- [ ] Run `npm run ops:smoke -- <deployment-url>`.
- [ ] Run `npm run ops:domain:check -- <hostname>` for every active domain.
- [ ] Verify tenant title, logo, colors, locale, currency, timezone, map center, legal links, favicon, and manifest.
- [ ] Verify invitation, recovery, verification, welcome, and administrator email links.
- [ ] Confirm health, browser events, API request IDs, and alert delivery.

## SaaS Workflows

- [ ] Platform administrator can inspect, filter, suspend, and reactivate programs.
- [ ] Program administrator can manage settings, team, domain, businesses, agreements, and reports only for that program.
- [ ] Multi-program users retain independent balances, agreements, memberships, and activity.
- [ ] Modified tenant identifiers, RPC calls, storage paths, exports, and invitations are rejected.
- [ ] Plan limits and feature flags are enforced by UI and database.

## Rollback Decision

- [ ] Define the observation window and decision deadline.
- [ ] Roll back deployment for application-only regressions.
- [ ] Disable the related feature flag before reverting an RPC dependency.
- [ ] Suspend an affected tenant for suspected cross-tenant writes.
- [ ] Restore DNS to the previous site when domain cutover fails.
- [ ] Never delete financial records as rollback.
- [ ] Reconcile all writes created after migration or cutover.
