# Loyality / RewardMe execution evidence

Local candidate, 2026-09-14. Full client scope remains incomplete; no feature has been excluded by the user.

## Baseline and authority

- Inline on main at 80dfca28b11b7218a73fed06b6e28da45169b742. No initial tracked modifications; the two plan documents, existing repair migration and diagnostic were already untracked.
- Stash 6f13e6303ae24e91bcbf1c6556f2a3f896884740 remains intact. Selected repair hunks and untracked tests restored; no translation-branch merge or saved production workflow import.
- Client/server/CLI/release target verified as bftuvmywtmpflizsomim with CLI 2.107.0. Read-only linked history returned exactly one existing 20260908121931 record; diagnostic returned zero inconsistencies. No replay/history repair/new remote SQL.
- All new migrations and frontend changes are LOCAL ONLY. No commit, push, deployment, financial activation or customer message occurred.
- See client-product-decisions.md for D2: everyone free first; additional tiers represented with backend support. Paid activation, prices, currency and benefits are not approved. This does not constitute completed paid-tier functionality.

## Current task matrix

| Task | State | Delivered / remaining |
| --- | --- | --- |
| T01 | Locally verified | Baseline, read-only target verifier, corrected setup guidance, existing migration/history checked. |
| T02 | Locally tested | Durable voucher journal, typed LY001 handling, uncertain-response replay, cross-tab lock, signup attribution/redirects, optional interval. |
| T03 | Locally tested | Real PostgreSQL baseline failures/repaired passes and 24 browser regressions. Hosted acceptance remains separate. |
| T04 | Partial | Free-first public copy, unavailable savings, planned-tier/milestone/guarantee labels, decision register. Final commercial/legal capability contract unresolved. |
| T05 | Partial | Atomic payload-bound intake, immutable acknowledgement journal, trusted host mapping, rate limit, browser retry recovery. Published commercial agreement acceptance remains blocked by D5. |
| T06 | Partial | Scoped paginated review, reasons, optimistic state check, immutable events and reviewer UI. Business provisioning/activation and negotiated-term acceptance remain unimplemented. |
| T07 | Blocked on D4/T06 | Source inventory confirms redemption access exists only on applications. Approved operational contracts, legacy classification and issued-commitment rules are required before enforcement; all-entry-point acceptance remains open. |
| T08 | Blocked on terms | Commission base/rate/units/reversals contract unresolved; no new financial accounting activated. |
| T09 | Partial | Free-member entitlement RPC, dormant tier catalog, frontend tier interest, historical record preservation and paid activation guard. Paid benefits/activation incomplete. |
| T10 | Blocked on terms | Referral/value-match rules and approved units unresolved. |
| T11 | Blocked on terms | Liability, settlement, payout/reversal contract unresolved; implementation/acceptance incomplete. |
| T12 | Blocked on rules | Birthday/anniversary/spend milestone rules unresolved. Existing visit rewards preserved. |
| T13 | Blocked on terms | Loyality paid pricing and cycle-credit rules unresolved. |
| T14 | Partial | Tenant-driven Loyality wordmark/auth branding. Automated white-label provisioning and durable demo intake incomplete. |
| T15 | Blocked on rules | Raffle operations/attribution and guarantee baseline/remedy rules unresolved. |
| T16 | Blocked on rules | Streak/network points rules unresolved; consumer scope remains open. |
| T17 | Blocked on contract | Savings unavailable in public copy; no invented balances/rates. Savings implementation incomplete. |
| T18 | Partial | Corrected heading cascade, marker alignment, header/footer contrast and mobile overflow checks. Final reference authority and full visual parity unresolved. |
| T19 | Partial | New copy translated, legacy/unit language audits pass, local route/viewport checks pass. Full accessibility and translation acceptance remain incomplete. |
| T20 | Partial | Atomic receipt/review outbox, lease-safe claims/finish/retry foundation. Provider sender, real delivery, operator retry UI and monitoring incomplete. |
| T21 | Local subset tested | Hosted preflight requires exact URL/revision/project/accounts/cleanup/mutation approval; required skips fail. Authenticated hosted matrix not run. Old paid-membership live suite needs free-first rewrite. |
| T22 | Local package prepared | File/hash manifest and ordered migration/containment guide. Final review, commercial decisions, release authorization and hosted acceptance remain open. |

## Exact local verification

Logs are under ignored .tools/loyality-pg; hashes are recorded in ops/loyality-rewardme-local-candidate.json.

| Command/check | Result |
| --- | --- |
| npm test | 145 legacy checks pass |
| npm run test:unit | 70 files, 403 tests pass |
| npm run lint | Pass; informational Babel large-file note only |
| npm run build | Pass (TypeScript and Vite) |
| npm run build:budget | Pass; 12,484,662 / 12,582,912 bytes; no credential exposures reported |
| npm run test:db:loyality | 25/25 pass, zero skips |
| npm run test:db:client-scope | 14/14 pass, zero skips |
| npm run test:migration-contracts | 12 contract checks pass |
| node --test scripts/verify-rewards-supabase-target.test.mjs scripts/verify-hosted-acceptance.test.mjs | 9/9 pass |
| node scripts/verify-rewards-supabase-target.mjs | Correct project verified |
| npm run test:e2e:loyality-public | 24/24 pass, zero skips |
| npm run test:e2e:client-scope | 7/7 pass, zero skips |
| git diff --check | Pass |

Meaningful failure evidence: restored frontend tests initially had 12 failures/19 passes, then 31/31 passed. Empty journal corruption and cross-tab overlap tests failed before their fixes. PostgreSQL baseline had 17 expected failures/8 passes; repaired schema passes all 25. Final unit run caught a missing Tagalog operations message, corrected before the 403/403 run.

Database tests use portable PostgreSQL 17.11 on 127.0.0.1:55439, unique disposable databases, and subset fixtures. They do not emulate the full Supabase Auth/PostgREST stack. Browser tests render real components with local service fixtures; no authenticated hosted mutation or actual email receipt is implied.

Responsive screenshots cover membership, signup and application at 320, 390, 768 and 1440 pixels. The final mobile application screenshot was visually inspected. Durable copies are at C:/Users/Admin/.codex/visualizations/2026/09/14/01a0a00b-f74d-7492-ab37-adb58d158734/local-candidate. Automated overflow/typography checks are not a complete accessibility audit.

## Release boundary

The four new migrations are ordered in loyality-rewardme-local-release.md. The old 20260908121931 migration is already deployed and must not be replayed. Application intake requires the private rate-limit secret; notifications have no sender. Missing new RPCs fail closed. Resolve decisions and complete outstanding implementation before release review; do not interpret this local package as production readiness.
