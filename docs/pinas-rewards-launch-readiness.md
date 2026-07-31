# Pinas Rewards launch readiness

## Flagship identity

- Program: Pinas Rewards
- Slug: `pinas`
- Locale: `en-PH`
- Currency: `PHP`
- Timezone: `Asia/Manila`
- Primary domain: `pinas-rewards.vercel.app`
- Support and sender address: `support@pinasrewards.ph`
- Brand colors: heritage gold `#A67608`, accent gold `#D9AD20`, ink `#11100E`
- Primary logo: `/pinas-rewards-logo.svg`
- Social preview: `/og.png`

Pinas Rewards is the default public program and must appear first in program selectors and platform administration views.

## Commercial configuration requiring owner approval

The current marketing presentation uses a Gold membership price of PHP 4,000 per year and describes eligible reward returns between 20% and 100%. Before taking live payments, the owner must approve the final membership price, reward rules, referral awards, commissions, settlement timing, refund and expiration rules, and Philippine tax treatment.

## Legal review required

Existing in-app terms are operational drafts. A Philippine-qualified legal professional must review the member terms, privacy notice, rewards and gift-card terms, referral terms, business agreements, consent language, and account-deletion wording.

`migration-packages/pinas/tenant-config.json` intentionally keeps `legalDocumentsReceived` set to `false` until reviewed documents are supplied.

## External production dependencies

- Keep `pinas-rewards.vercel.app` as the canonical zero-cost production address.
- Create `support@pinasrewards.ph`.
- Configure SMTP/API delivery plus SPF, DKIM, and DMARC.
- Configure each tenant's verified sender name and address in program settings.
- Apply the reviewed pending Supabase migrations.

## Validation gates

- Production build and unit tests
- Tenant package and branding validation
- Mobile readiness and responsive browser checks
- Customer, business, staff, program-admin, and platform-admin acceptance flows
- Production health, email, domain, migration, and rollback checks
