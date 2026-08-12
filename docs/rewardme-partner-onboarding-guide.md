# RewardMe partner onboarding guide

## Intake and validation

1. Copy [the partner template](templates/rewardme-partners.csv) and
   [the offer template](templates/rewardme-offers.csv); do not rename headers.
2. Use stable source IDs. Keep one row per legal business and one row per offer.
3. Mark a partner active only after the agreement is signed. Mark an offer active
   only when its partner is active and inventory, dates, restrictions, funding,
   reward rate, and commission are approved.
4. Run:

   `npm run validate:rewardme-partners -- partners.csv offers.csv`

5. Resolve every error and review every warning. The validator is report-only;
   it does not write to Supabase or publish a partner.
6. Create a tamper-evident review package in a new directory:

   `npm run prepare:rewardme-partners -- partners.csv offers.csv rewardme-import-review`

   The package contains the unchanged source files, validation evidence, and a
   SHA-256 manifest. It remains review-only and cannot activate or publish data.

Use the [inactive partner example](templates/rewardme-partners-example.csv) and
[inactive offer example](templates/rewardme-offers-example.csv) as formatting
references only. Replace every sample value and keep records inactive until
the named approvals below are complete.

## Before activation

- Confirm the signed agreement, legal business name, locations, owner contact, offer, exclusions, reward rate, commission, taxes, settlement cycle, and refund handling.
- Require E.164 phone numbers (for example `+639171234567`) and one of the supported settlement cycles: `weekly`, `biweekly`, `monthly`, or `manual`.
- Assign one owner and named staff accounts; never share credentials.
- Place the partner QR/signage where staff and members can see it.
- Run one training sale and one reversal before serving members.
- Retain the validated intake files, signed agreement, approval record and test evidence.

## Admin review and activation controls

1. Use `/admin/portal#partners` to create or review the partner. The admin form
   covers identity, public listing, location, reward settings, tax and service
   settings, owner invitation, and an optional required e-signature agreement.
2. Use `/admin/portal#agreements` to confirm the correct agreement version and
   signature status. A CSV value of `signed` is intake evidence only; retain the
   actual signed document and verify the in-app agreement record where required.
3. Keep the partner inactive until the signed agreement, named owner, complete
   public information, approved commercial settings, and training evidence are
   present. Use the Active/Inactive and missing-information filters during review.
4. Use `/admin/portal#promotions` for controlled live offers. Confirm partner,
   eligibility, dates, inventory, reward economics, restrictions, and owner
   approval before launch. Pause the partner or offer when any approval expires.
5. CSV validation and review packaging never activate a record. A platform
   administrator must deliberately create or update the reviewed record.

## Daily workflow

1. Staff sign in through **Business Login**.
2. Scan the member QR or use the documented manual fallback.
3. Confirm the member name and eligible amount.
4. Enter the sale once and retain the normal receipt.
5. Confirm the success state before closing the screen.
6. Review transaction history at shift close.

## Escalate

Pause and contact support for duplicate transactions, mismatched member identity, suspicious repeated scans, unavailable service, settlement differences, or a reported privacy incident.
