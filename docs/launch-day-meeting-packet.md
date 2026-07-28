# Four-brand SaaS launch-day meeting packet

## Decision

- Hosted project: `retfuxpfstatpdsunkgj`
- Release commit: ____________________
- Deployment URL: ____________________
- Incident lead: ____________________
- Database operator: ____________________
- Tenant owner: ____________________
- Rollback decision deadline: ____________________

## Exact migration approval

Use this wording only after backup and preflight evidence is reviewed:

> Approve applying `20260728000000_tenant_limits_and_storage_isolation.sql`, `20260729000000_program_state_usage_and_audit.sql`, and `20260730000000_domain_team_and_import_operations.sql`, in that order, to Supabase project `retfuxpfstatpdsunkgj`.

This approval does not authorize unrelated migrations, destructive rollback, tenant import, or production data repair.

## Timeline

1. Freeze tenant imports and record baseline totals.
2. Validate backup and read-only hosted preflight.
3. Record exact approval and migration hashes.
4. Apply migrations in order.
5. Run data quality, performance, reconciliation, hosted isolation, and authenticated acceptance.
6. Deploy the validated commit and verify `/api/health`.
7. Cut over one tenant domain at a time.
8. Run tenant browser, email-link, PWA, and reconciliation checks.
9. Record accept, hold, or rollback decision.

## Rollback decision tree

- Application or routing regression: restore the previous deployment.
- Domain or TLS regression: restore the previous DNS target.
- Feature-policy regression: use the matching approved safe-disable guide.
- Isolation or financial discrepancy: suspend the affected program, preserve audit evidence, stop writes, and reconcile before repair.
- Never delete financial or agreement records to imitate rollback.

## Required evidence

- [ ] Backup manifest and validation
- [ ] Migration hashes and linked migration status
- [ ] Preflight data-quality and performance output
- [ ] Zero-difference reconciliation
- [ ] Hosted isolation and authenticated Playwright results
- [ ] Deployment health and domain results
- [ ] Email redirect and sender verification
- [ ] Tenant owner sign-off
