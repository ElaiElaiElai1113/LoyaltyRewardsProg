# Local client-scope candidate: release and containment

This is an uncommitted local candidate based on main 80dfca28b11b7218a73fed06b6e28da45169b742. No new production SQL, deployment, commit or push is authorized. See the acceptance evidence and product decision register; the complete client scope is not finished.

## Ordered new migrations

1. 20260914132132_business_application_intake_integrity.sql — scoped request/payload journal and immutable intake acknowledgement; service-only atomic submission.
2. 20260914132714_rewardme_free_first_entitlements.sql — free RewardMe access for active program members, dormant tier catalog, and denial of new paid activation/renewal. Preserves existing subscriptions and balances.
3. 20260914133201_business_application_review.sql — scoped reviewer access, expected-state transitions and immutable review events. Does not provision or activate a business.
4. 20260914133559_business_application_notification_outbox.sql — atomic receipt/review notification queue and delivery leases. No sender/worker is deployed; no email has been sent.

20260908121931_loyality_review_integrity_and_retry.sql is ALREADY DEPLOYED/RECONCILED. Its restored source belongs in the eventual diff but it is not a pending migration.

## Before release

- Resolve required commercial and design decisions in client-product-decisions.md. Additional tiers currently support interest review and retained history; activation and financial benefits are not complete.
- Review and approve the exact source/migration hashes, target project, affected programs and rollout window. Do not blanket-push/reset. Run the target verifier and inspect actual history/schema first.
- Configure BUSINESS_APPLICATION_RATE_LIMIT_SECRET as a private random server secret; optionally set BUSINESS_APPLICATION_HOURLY_LIMIT (1–100; default 10). The secret must stay stable across application workers. No application submission is enabled without it.
- Deploy the additive backend before the corresponding frontend. Missing entitlement RPCs fail closed; do not claim free-member acceptance until direct authenticated earning/redemption checks pass on the approved target.
- Back up the approved target and rehearse restore in isolation. Complete authenticated member/owner/staff/admin tests in two programs, then reconcile fixture cleanup.
- Hosted acceptance requires explicit origin, full app revision, project, comma-separated approved test-account list, cleanup plan and mutation approval. Health must report the same full sourceRevision/projectRef. Required skipped tests fail acceptance. The old paid activation suite still needs rewriting for free-first behavior before it can be used as a release gate.
- Application notification delivery requires a provider adapter that supports durable idempotency/reconciliation using event_key. A provider response timeout must not create a second email. The queue is infrastructure only; actual authorized recipient receipt, sender configuration, operator retry UI and delivery monitoring remain unverified.

## Containment / rollback

- Stop the notification worker (none currently supplied/deployed); retain queued/delivered rows and provider references. Never re-run intake/review to resend an email.
- Disable the application API through deployment configuration if needed. Revoke EXECUTE on submit_business_application_intent from service_role to contain intake while preserving committed references and evidence; arrange a read-only receipt lookup before withdrawing retry access.
- Remove reviewer route access or revoke EXECUTE on review_business_application from authenticated if review must be paused. Preserve existing applications and audit rows.
- Keep the RewardMe paid activation guard in place while terms are unresolved. Rolling back frontend alone must not restore paid activation. Historical cancellation/read access should remain available.
- Do not drop journals, delete accepted records, recalculate balances or rewrite historical migrations as rollback. Correct defects with an additive migration, explicit authorization and reconciliation.

## Local test runtime

Portable PostgreSQL 17.11 (EDB distribution) was used on 127.0.0.1:55439. Tests create uniquely named disposable databases and drop them afterward. The source fixtures are dependency subsets, not a full Supabase Auth/PostgREST deployment. Browser suites replace service boundaries locally. Neither proves authenticated production acceptance.
