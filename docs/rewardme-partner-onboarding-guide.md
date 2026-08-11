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

## Before activation

- Confirm the signed agreement, legal business name, locations, owner contact, offer, exclusions, reward rate, commission, taxes, settlement cycle, and refund handling.
- Assign one owner and named staff accounts; never share credentials.
- Place the partner QR/signage where staff and members can see it.
- Run one training sale and one reversal before serving members.
- Retain the validated intake files, signed agreement, approval record and test evidence.

## Daily workflow

1. Staff sign in through **Business Login**.
2. Scan the member QR or use the documented manual fallback.
3. Confirm the member name and eligible amount.
4. Enter the sale once and retain the normal receipt.
5. Confirm the success state before closing the screen.
6. Review transaction history at shift close.

## Escalate

Pause and contact support for duplicate transactions, mismatched member identity, suspicious repeated scans, unavailable service, settlement differences, or a reported privacy incident.
