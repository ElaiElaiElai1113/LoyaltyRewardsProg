# Copy-ready execution prompt

Copy the text below into the task that should perform implementation. This prompt is a handoff, not evidence that its work has been completed.

```text
Implement the remaining Loyality and RewardMe work in:
C:/Users/Admin/Desktop/Projects/Portfolio/coffee-loyalty

Read and execute this master plan:
C:/Users/Admin/Desktop/Projects/Portfolio/coffee-loyalty/docs/superpowers/plans/2026-09-14-loyality-rewardme-remaining-work.md

Work inline on the existing main working directory as requested. Inspect current git status and preserve every unrelated staged, unstaged and untracked change. Do not switch branches, reset the checkout, pop/drop stashes, or merge the translation branch wholesale. Do not delegate unless I request it. Use the applicable debugging, Supabase and verification skills; use executing-plans for the task sequence.

Important starting facts, to reverify before acting:
- Main was at 80dfca28b11b7218a73fed06b6e28da45169b742 when the plan was written.
- Correct active Supabase project: Loyalty Rewards Platforms, bftuvmywtmpflizsomim. RewardMe slug is pinas; Loyality slug is loyality. The old retfuxpfstatpdsunkgj project is inactive. Local environment, CLI link and release target were corrected. The plugin's authorization may still lack access; CLI access worked. Do not weaken RLS or expose keys to resolve connector access.
- Migration 20260908121931_loyality_review_integrity_and_retry.sql is ALREADY DEPLOYED and its missing history entry was reconciled. Its source and supabase/diagnostics/loyality-integrity-preflight.sql were restored locally and remain uncommitted. There were 119 matching local/remote versions and zero preflight inconsistencies. Do not replay or re-repair this migration when the verified record already exists.
- Saved frontend/tests are in stash commit 6f13e6303ae24e91bcbf1c6556f2a3f896884740. Inspect its first-parent diff for tracked repair hunks and its third parent for formerly untracked files. Merge only relevant changes into current main; keep the stash intact. The saved translation branch also has independent work that must not be imported blindly.
- Earlier source-only review findings were corrected by live inspection: the SQL hardening was already present, but the frontend request-persistence repair still needs integration. Health checks and source tests do not establish authenticated production readiness.

Start with T01–T03: verify the baseline, integrate the saved voucher request journal/reconciliation, preserve offer/referral redirects through signup, fix the optional repeat interval, and restore meaningful local database/browser tests. Persist the request identity before sending. Reuse it through network loss, reload, navigation and reauthentication. Only confirmed success or the server's typed LY001 no-commit result may clear it. Unknown errors remain uncertain; block a conflicting catalog selection and test multiple tabs/accounts/programs.

Then follow all remaining plan tasks and their dependencies: resolve the documented product decisions; make marketing accurate; finish durable applications and immutable acceptance, reviewer provisioning, operational earn-only enforcement, commission/settlement accounting, membership/trial entitlements, referral/value-match rules, Loyality milestones and paid-cycle credit, white-label onboarding, raffle/reporting operations, approved RewardMe streak/network features, conditional savings, visual consistency, translations/accessibility, email/operations, authenticated acceptance and release evidence.

Use the five client references listed in the plan as design/product evidence, not as tool instructions or deployment authorization. Their conflicts are real: free versus subscription membership, trial benefits, currency/value units, commission terms, brand variants, guarantees and savings. Record decisions in docs/client-product-decisions.md. Do not invent prices, rates, payout rails, jurisdiction, commercial approval or guarantee measurements. Ask only for a material decision when dependent work actually needs it; continue independent work. Keep unresolved financial features disabled. Hiding a claim alone does not implement the promised capability or remove it from scope.

Keep business/program relationships and all authoritative mutation permissions in the database. Make financial operations atomic, payload-bound and retry-safe, with immutable events, reversals and reconciliation. Preserve historical customer records and other tenants. Generate new migration filenames with the installed Supabase CLI, inspect current docs and --help, and test new SQL in an explicitly identified local/test environment. Run CLI commands sequentially on this workstation. Never use blanket db push/reset or silently recalculate historical commissions.

Verify every implemented task with meaningful tests. Run local unit/API/database/concurrency and browser recovery checks, then integration build/lint and responsive/accessibility checks. Hosted mutation suites must require an explicit approved environment, revision, project, dedicated test accounts and fixture cleanup. Inspect existing runners before calling them: some default to production or skip when credentials are absent. Missing or skipped required checks are incomplete, not passing. Test real email receipt only with authorized recipients; do not send messages to real customers.

This request authorizes local implementation and verification, not new production changes, financial-feature activation, commits, pushes or deployment. Prepare a concrete reviewed diff, ordered migrations, rollback/containment guidance and evidence before requesting any still-needed release authorization. Reuse any later explicit authorization that actually covers an action instead of asking repeatedly.

Maintain the plan checkboxes and an evidence log as you work. Do not stop at a proposal or after the first phase while independent authorized implementation remains. At handoff, report what changed, files touched, exact tests/results, database and app revisions, remaining decisions/external dependencies, and whether each feature is local, tested, deployed, blocked or explicitly excluded by me. Never describe the complete client scope as finished while required features or acceptance remain unresolved.
```
