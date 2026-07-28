# Incident and cutover runbook

## Incident response

Record start time, affected tenants, domains, request IDs, deployment, and suspected write exposure. Suspend affected programs when isolation may be compromised. Preserve logs and exports before repair.

## Domain cutover

Validate backup, imports, reconciliation, authentication redirects, email sender DNS, health, and browser workflows. Lower DNS TTL in advance, keep the previous site available, switch one tenant at a time, then run post-deployment verification.

## Rollback

Restore the previous deployment or DNS target first. Database rollback requires separate approval and the matching safe-disable guide; never remove financial activity to imitate rollback.

## Reconciliation

Compare users, memberships, balances, transactions, agreements, gift cards, businesses, and orders. A tenant cutover is complete only after the zero-difference report and owner sign-off are retained.
