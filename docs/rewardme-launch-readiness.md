# RewardMe launch readiness

## Flagship identity

- Program: RewardMe
- Slug: `pinas`
- Locale: `en-PH`
- Currency: `PHP`
- Timezone: `Asia/Manila`
- Primary domain: `loyalty-rewards-prog.vercel.app`
- Proposed support address: `support@rewardme.ph`
- Verified sender address: not configured
- Brand colors: heritage gold `#A67608`, accent gold `#D9AD20`, ink `#11100E`
- Primary logo: `/rewardme-logo.svg`
- Social preview: `/og.png`

RewardMe is the default public program and must appear first in program selectors and platform administration views.

## Commercial configuration requiring owner approval

The approved pitch proposes Free at $0, Regular at $25/month, and Gold at $100/year, with eligible reward returns between 20% and 100%. RewardMe does not collect online payments. Before staff manually activate Regular or Gold access, the owner must approve price treatment, taxes, renewal and cancellation, reward rules, referral awards, commissions, settlement timing, refunds, expiration, and the membership-fee reward match.

## Legal review required

Existing in-app terms are operational drafts. A Philippine-qualified legal professional must review the member terms, privacy notice, rewards and gift-card terms, referral terms, business agreements, consent language, and account-deletion wording.

`migration-packages/pinas/tenant-config.json` intentionally keeps `legalDocumentsReceived` set to `false` until reviewed documents are supplied.

## External production dependencies

- Keep `loyalty-rewards-prog.vercel.app` as the canonical zero-cost production address.
- Create `support@rewardme.ph`.
- Configure SMTP/API delivery plus SPF, DKIM, and DMARC.
- Configure each tenant's verified sender name and address in program settings.
- Review and apply only approved pending Supabase migrations. Savings remains deliberately disabled by default, and historical payment-provider schema is not used by the application.

## Completed approval-ready foundations

- Counsel-ready legal drafts, including referral and savings supplements, plus a legal approval register.
- Pitch-aligned commercial decision register, decision-ready recommendations,
  and owner sign-off sheet.
- Partner and offer CSV templates, inactive examples, report-only validation,
  automated tests, and a review package with SHA-256 source checksums.
- Protected `/admin/readiness` control register with named owners, next actions,
  and separate verified, executable, approval, and external-input statuses.
- Recoverable empty and error states for missing pages, team loading, empty team,
  filtered programs, and partner catalogs.
- Production-safe RewardMe authenticated QA tooling using isolated public test users,
  role and program memberships, a QA partner, member balance, customer link,
  catalog entries, a recorded purchase, activity history, and an issued gift card.
- A fail-closed published-account Playwright check that verifies every displayed
  login reaches the correct authenticated portal when deliberately invoked.
- Automated recovery and invitation contract checks covering normalized email
  addresses, approved redirect routes, PKCE exchange, verified invitation
  domains, session setup, password updates, and neutral shared auth templates.
- An eight-document legal-pack technical gate covering RewardMe identity, draft
  disclosures, public routes, section structure, owner-input markers, and the
  counsel approval register. It does not replace legal approval.
- Touch-enabled Playwright coverage for six phone/tablet sizes and both
  orientations, plus a 240-check screenshot-based responsive route audit.
- Browser-led QA that covers public pages without database credentials, verifies
  all four published RewardMe roles, and keeps mutation-heavy hosted tests behind
  explicit QA-project authorization.
- A single deployment switch, `VITE_SHOW_PUBLIC_QA_CREDENTIALS=false`, that hides
  all public test credentials before launch.
- A complete technical Regular/Gold operations flow with explicit no-online-payment
  disclosure, authenticated requests, staff approval/decline, activation, renewal,
  cancellation, recovery, immutable history, email templates, and a tested SOP.
  Commercial, legal, sender, and real-world evidence gates remain external.
- Savings goal and read-only ledger schema with RLS, tenant ownership checks, and
  separate program/plan feature gates. No lock, release, bonus, maturity or payout mutation is active.
- Spanish and Filipino translations for the public legal approval notice.

See [the activation gate](rewardme-billing-and-savings-activation.md) for the
remaining approval, test-account, manual-enrollment, database, and release steps.

## Validation gates

- Production build and unit tests
- Tenant package and branding validation
- Mobile readiness and responsive browser checks
- Customer, business, staff, program-admin, and platform-admin acceptance flows
- Production health, email, domain, migration, and rollback checks
- Six-hour deep RewardMe/Wondertown verification of published logins, tenant
  roles, catalog fixtures, member balances, customer links, transactions, and
  gift cards, with JSON evidence retained by GitHub Actions.
- Live, mutation-aware Playwright gift-card commands for RewardMe and Wondertown
  that fund a member, issue a card, redeem it once, reject a second redemption,
  and verify both the member wallet and business transaction view.

## Current live QA status

The four private accounts and isolated QA fixtures are provisioned in the
Supabase project used by the RewardMe Vercel deployment. Password login is
verified for the member, business owner, business staff and platform
administrator accounts. The private authenticated gate passes for all four
roles, and the hosted-safe RewardMe suite verifies tenant isolation plus mobile
authentication without a dead end.

The release workstation can repeat this idempotently without storing or printing
project keys:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/provision-rewardme-production-qa.ps1 -Apply -RunAuthenticatedChecks
```

QA credentials remain private testing infrastructure. Keep
`VITE_SHOW_PUBLIC_QA_CREDENTIALS=false`, run the release-mode and bundle checks,
and rotate the four isolated accounts after any suspected disclosure.
