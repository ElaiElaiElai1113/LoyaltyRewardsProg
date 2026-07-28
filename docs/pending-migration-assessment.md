# Pending Hosted Migration Assessment

Target project: Rewards Program (`retfuxpfstatpdsunkgj`)

This document is a review record, not approval to apply migrations.

## `20260728000000_tenant_limits_and_storage_isolation.sql`

Purpose: enforce plan limits for custom domains, businesses, and members; replace legacy verification-document policies with tenant-scoped paths.

Preconditions:
- Every provisioned program has a subscription plan with entitlements.
- Existing verification paths match `pending/<program-id>/...`.
- Existing businesses and memberships have valid `program_id` values.

Risks and mitigations:
- A missing subscription resolves limits to zero and blocks new resources. Reconcile subscriptions before apply.
- Anonymous onboarding uploads can still consume storage. Bucket MIME/size restrictions, rate limiting, and periodic orphan cleanup are required operational controls.
- Existing incorrectly shaped verification paths become unreadable. Export and inspect path counts before apply.
- Program-admin reads now authorize against the program UUID encoded in the object path, not the legacy profile program field.

Rollback: drop the three limit triggers and new storage policies, then restore the previous reviewed policies. Do not remove tenant identifiers or uploaded objects.

## `20260729000000_program_state_usage_and_audit.sql`

Purpose: status-aware domain resolution, platform usage, feature entitlement enforcement, audited program state changes, and verified tenant email branding.

Preconditions:
- Feature entitlements exist for every active program.
- All active production domains are verified.
- `admin_logs` accepts tenant-scoped lifecycle records.

Risks and mitigations:
- Disabling an entitlement also blocks deletes from the protected tables. Perform archival before disabling the feature.
- Pending or suspended domains are intentionally returned only by the host-state resolver so the UI can show the correct state.
- Email branding resolves only active programs on verified domains. Pending domains use the controlled SMTP fallback.

Rollback: remove entitlement triggers and disable the state RPC feature flag before reverting functions. Preserve lifecycle audit rows.

## `20260730000000_domain_team_and_import_operations.sql`

Purpose: secure domain requests, verified-primary selection, membership suspension controls, and auditable idempotent import batches.

Preconditions:
- The enum and table names do not already exist from manual dashboard changes.
- Every program retains at least one active administrator.
- `handle_updated_at()` exists.

Risks and mitigations:
- PostgreSQL enum creation is not rerunnable after a partially recorded manual apply. Use CLI migration history consistently.
- Reusing an idempotency key with different content now raises `idempotency_payload_mismatch`; it cannot silently alter the original batch.
- Rollback never deletes imported financial records. Suspend, export post-import writes, reconcile, and correct forward.

Rollback: revoke RPC execution and suspend affected import operations. Retain batch and audit records.

## Apply Gate

1. Validate a fresh backup.
2. Capture pre-change reconciliation and storage-path reports.
3. Confirm all active programs have subscriptions and feature entitlements.
4. Obtain explicit approval naming the project and all migration files.
5. Apply in timestamp order.
6. Enable `VITE_TENANT_STATE_RPC_ENABLED=true` only after migration 29 succeeds.
7. Run hosted-safe, tenant-security, authenticated role workflows, reconciliation, and deployment smoke checks.
