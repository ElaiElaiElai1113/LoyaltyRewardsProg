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

The approved pitch proposes Free at $0, Regular at $25/month, and Gold at $100/year, with eligible reward returns between 20% and 100%. Before taking live payments, the owner must approve billing currency, tax treatment, renewal and cancellation, reward rules, referral awards, commissions, settlement timing, refunds, expiration, and the membership-fee reward match.

## Legal review required

Existing in-app terms are operational drafts. A Philippine-qualified legal professional must review the member terms, privacy notice, rewards and gift-card terms, referral terms, business agreements, consent language, and account-deletion wording.

`migration-packages/pinas/tenant-config.json` intentionally keeps `legalDocumentsReceived` set to `false` until reviewed documents are supplied.

## External production dependencies

- Keep `loyalty-rewards-prog.vercel.app` as the canonical zero-cost production address.
- Create `support@rewardme.ph`.
- Configure SMTP/API delivery plus SPF, DKIM, and DMARC.
- Configure each tenant's verified sender name and address in program settings.
- Review and apply only the approved pending Supabase migrations. The member-billing and savings foundations are deliberately disabled by default.

## Completed approval-ready foundations

- Counsel-ready legal drafts, including referral and savings supplements, plus a legal approval register.
- Pitch-aligned commercial decision register and owner sign-off sheet.
- Partner and offer CSV templates with a report-only validator and automated tests.
- Fail-closed RewardMe Stripe checkout/webhook scaffolding with replay protection,
  fixed trusted return URLs, test price configuration, and disabled server/database gates.
- Savings goal and read-only ledger schema with RLS, tenant ownership checks, and
  separate program/plan feature gates. No lock, release, bonus, maturity or payout mutation is active.
- Spanish and Filipino translations for the public legal approval notice.

See [the activation gate](rewardme-billing-and-savings-activation.md) for the
remaining approval, test-account, Stripe, database and release steps.

## Validation gates

- Production build and unit tests
- Tenant package and branding validation
- Mobile readiness and responsive browser checks
- Customer, business, staff, program-admin, and platform-admin acceptance flows
- Production health, email, domain, migration, and rollback checks
