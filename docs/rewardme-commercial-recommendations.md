# RewardMe commercial recommendations

Status: **RECOMMENDED FOR OWNER, LEGAL, AND TAX APPROVAL — NOT YET ACTIVE**

These defaults translate the approved pitch-deck direction into implementable
rules without pretending that commercial, legal, accounting, or tax decisions
have been signed. Record the final decision in
`rewardme-commercial-owner-signoff.md` before enabling live billing, rewards,
referrals, partner settlement, gift cards, or the savings product.

## Decision-ready defaults

| Area | Recommended default | Why this is the safest launch default | Approval |
| --- | --- | --- | --- |
| Free access | Three calendar months from account creation, no card required. Show the exact end date. Send reminders 14, 7, 3, and 1 day before expiry. | Matches the deck while making the end state predictable. | Owner + legal |
| Trial end | Move the account to Free at expiry unless the member actively selects a paid plan. Do not auto-charge without explicit checkout consent. | Avoids surprise charges and an unusable expired-account dead end. | Owner + legal |
| Trial earning | No reward accrual, redemption, referral bonus, or savings match during the free-access period. Browsing remains available. | Matches current product copy and avoids unfunded liability. | Owner + accounting |
| Free plan | USD 0; access to participating offers up to a published maximum of 10%, subject to each offer's terms. | Matches the pitch deck without promising 10% on every purchase. | Owner + legal |
| Regular plan | USD 25 per month. Paid access begins only after confirmed payment; renew monthly until cancelled. | Matches the pitch deck and keeps entitlement tied to verified billing state. | Owner + tax |
| Gold plan | USD 100 per year. Paid access begins only after confirmed payment; renew annually until cancelled. | Matches the pitch deck and keeps annual accounting explicit. | Owner + tax |
| Currency | Charge the published USD price. If PHP estimates are shown, label them estimates and show the exact charge currency before checkout. | Prevents exchange-rate ambiguity. | Owner + tax |
| Cancellation | Cancel at period end. Keep access through the paid period. Do not issue prorated refunds except where law requires or for verified duplicate/technical charges. | Simple to explain and reconcile. | Owner + legal |
| Eligible spend | Calculate rewards on the final eligible merchandise/service subtotal after discounts; exclude taxes, tips, gift-card purchases, refunded/voided items, and explicitly excluded categories. Round each reward to two currency decimals. | Reduces reward disputes and double counting. | Owner + accounting + legal |
| Offer rates | The partner's signed offer controls the rate. Never infer a universal rate from “20%+”, “100%”, or “<20%” marketing examples. | Keeps marketing examples from becoming unbounded liabilities. | Owner + partner |
| Referral bonus | Recommend USD 10 only after the referred member completes a first paid qualifying transaction and the refund window closes. One attribution per new member; no self-referrals; reverse fraudulent or refunded bonuses. | Ties acquisition cost to verified value and limits abuse. | Owner + legal + accounting |
| Gold referral uplift | Keep disabled until an exact amount, qualification event, cap, and fraud rule are signed. | The deck direction is not specific enough to calculate safely. | Owner |
| Membership value match | Keep disabled until contribution timing, vesting, withdrawal, cancellation, tax treatment, custody, and accounting entries are approved. | This creates financial liability and must not be inferred from marketing copy. | Owner + legal + tax + accounting |
| Partner commission | Treat the 25% pitch figure as a proposal, not a live universal rate. Store the signed rate per partner and define whether it applies to rewards issued, redeemed, or settled. | The calculation base materially changes partner economics. | Owner + partner + accounting |
| Settlement | Recommend monthly settlement with a seven-day review window, itemized statement, reversal handling, and a documented dispute path. | Provides a practical audit window without promising real-time settlement. | Owner + accounting + partner |
| Support | Publish a monitored mailbox, response target, support hours, urgent escalation path, and privacy/security incident path before launch. | Removes the final operational support dead end. | Operations owner |
| Gifts and savings | Keep both visibly unavailable and non-transactable until their separate legal, funding, custody, accounting, and fulfillment gates pass. | The UI is fail-closed; the business policy should be equally explicit. | Owner + legal + tax + accounting |

## Required approval record

For each accepted row, record the final rule, approver name, role, date, and
evidence link in the owner sign-off. Any changed recommendation must be reflected
in member copy, partner terms, data rules, tests, and support procedures before
activation.

## Activation rule

No approval means no live transaction. The public site may describe the intended
program with honest availability labels, but Stripe products, reward funding,
referral payouts, partner settlement, savings matching, and gift-card fulfillment
must remain disabled until their exact gate is signed and tested.
