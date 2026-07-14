# Membership Price $25 USD Design

## Goal

Change the demo monthly membership fee from $10 USD to $25 USD everywhere the membership price is presented or stored, while preserving the separate $10 instant reward credit.

## Scope

- Show a $25 monthly membership fee on the membership page, membership banner, and earn/redeem gate.
- Keep the instant membership reward credit at $10 in visible copy, toasts, and reward-balance logic.
- Update English and Spanish membership-price strings without changing unrelated membership wording.
- Store `2500` cents as the mock membership price for new subscriptions and renewals.
- Forward-update existing USD mock memberships that still carry the old `1000`-cent price.
- Update the role walkthrough so its demo pricing matches the application.

## Implementation Approach

Add shared frontend constants for the monthly fee and reward credit, then consume those constants anywhere a numeric membership price is rendered. Add a forward Supabase migration rather than rewriting the historical membership migration; the migration updates the table default, existing mock rows, and the subscription/renewal RPCs. The credit grant remains `1000` cents.

## Verification

- Add a source-contract test that distinguishes the $25 fee from the unchanged $10 credit.
- Run the test once before implementation to confirm it fails.
- Run the full repository test suite, targeted lint, production build, and `git diff --check` after implementation.

## Non-Goals

- No change to the $10 instant reward credit.
- No payment-gateway integration or real charge.
- No redesign of the membership interface.
- No changes to the public homepage's COP-denominated Regular Membership offer.
