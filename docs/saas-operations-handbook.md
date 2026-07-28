# SaaS Operations Handbook

## Daily Operations

1. Check `/api/health` or run `npm run ops:health -- <deployment-url>`.
2. Review suspended, draft, and pending-domain programs in the platform console.
3. Review tenant usage against administrator, business, member, domain, and storage limits.
4. Investigate failed lead capture, email, authentication, and database requests using `X-Request-Id`.
5. Never alter balances or financial records directly from the Supabase table editor.

## Release Checklist

1. Confirm the intended branch and review the complete diff.
2. Run typecheck, lint, unit tests, production build, and `test:e2e:ci`.
3. Run hosted-safe tests separately when Supabase credentials are available.
4. Confirm pending migrations and obtain explicit approval before `db push`.
5. Create and validate a database backup before any approved migration.
6. Deploy, then run `npm run ops:smoke -- <deployment-url>`.
7. Check tenant resolution for all four brands and verify no runtime console errors.

## Incident Response

1. Record the start time, affected program, hostname, user roles, and request IDs.
2. Suspend only the affected tenant when isolation is possible.
3. Preserve logs and take a reconciliation snapshot before corrective writes.
4. For a deployment regression, restore the previous application deployment.
5. For domain failure, restore the previous DNS target and keep the old site available.
6. Never restore a database backup directly over production. Prove the restore in a disposable environment first.
7. Document the cause, data impact, recovery actions, and prevention work.

## Backup Retention

1. Keep the dump and its manifest together.
2. Validate checksum, byte count, and archive entries after creation.
3. Retain daily backups for 14 days, weekly backups for 8 weeks, and pre-migration backups for 12 months.
4. Store at least one encrypted copy outside the deployment account.
5. Do not commit dumps, manifests containing infrastructure metadata, or reconciliation exports.
6. Perform quarterly restore drills in a disposable environment.

## Tenant Archival

1. Suspend the program and prevent new writes.
2. Export members, balances, transactions, agreements, gift cards, businesses, and audit history.
3. Generate and approve a final reconciliation report.
4. Remove domain routing only after the export is verified.
5. Retain financial and legal records according to the tenant's approved retention policy.
6. Archive records in place. Do not cascade-delete a tenant with financial activity.

## Migration Approval

Every approval must name the hosted project and exact migration files. Approval to review, commit, or push code is not approval to alter the hosted database.
