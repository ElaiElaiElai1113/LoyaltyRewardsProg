# RewardMe billing and savings activation gate

Both foundations are committed as disabled infrastructure. They are not live
member features and must remain fail-closed until this checklist is complete.

## Member billing

1. Complete the commercial owner sign-off and legal/tax approval.
2. Apply `20260811085042_rewardme_member_billing_foundation.sql` in a test project.
3. Create Stripe test products/prices for Regular ($25/month) and Gold ($100/year).
4. Configure test secrets and the `/api/rewardme-stripe-webhook` endpoint.
5. Implement and approve the membership-fee reward-match posting and reversal rules.
6. Run checkout, duplicate webhook, renewal, cancellation, refund, past-due,
   unpaid, replay, cross-tenant and mobile Playwright tests.
7. Set the RewardMe database flag `memberBilling` to true only in test.
8. Repeat the release gates with live price IDs, then set
   `REWARDME_MEMBER_BILLING_ENABLED=true` during an approved release window.

## Savings

1. Complete the savings section of the owner sign-off and obtain specialist legal review.
2. Apply `20260811084843_rewardme_savings_foundation.sql` in a test project.
3. Implement audited, atomic lock/release/bonus/payout RPCs; direct ledger writes stay revoked.
4. Add reconciliation, statements, support corrections, maturity processing and alerts.
5. Add complete authenticated Playwright coverage and database concurrency tests.
6. Add `savingsPlans` to an approved plan entitlement and set the RewardMe
   program flag to true only after all release gates pass.

Disabling either the program flag or the server billing switch must prevent new
enrollment. Webhook processing should remain available long enough to reconcile
existing Stripe subscriptions during any shutdown.
