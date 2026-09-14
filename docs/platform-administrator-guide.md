# Platform administrator guide

## Daily operations

Review program status, domain verification, usage limits, support requests, failed health checks, and audit activity. Use platform authority only for cross-program operations; tenant administrators remain responsible for their own program configuration.

## Program suspension

Record the reason and affected program, export current audit evidence, then suspend through the platform console. Confirm public domain resolution no longer exposes an active program. Never edit balances as a suspension mechanism.

## Migration approval

Run `npm run ops:migrations:validate` and `npm run ops:hosted:preflight`. Run `node scripts/verify-rewards-supabase-target.mjs` first. Approval must name project `bftuvmywtmpflizsomim` and every migration filename. A code commit or deployment approval is not database approval.

## Incident response

Follow `incident-and-cutover-runbook.md`. Preserve request IDs, audit exports, reconciliation reports, and deployment identifiers before corrective action.

Target correction (2026-09-14): the former retfuxpfstatpdsunkgj reference was retired. Historical incident records retain their original targets and are not current execution instructions.
