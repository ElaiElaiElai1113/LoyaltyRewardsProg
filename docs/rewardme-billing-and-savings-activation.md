# RewardMe membership and savings activation gate

Online payment processing is not part of RewardMe. Free access is self-service;
Regular and Gold access is requested through the site and assigned manually by
authorized operations staff after the rules below are approved.

## Manual membership enrollment

Implemented technical controls:

- authenticated member request, cancellation request, pending-request
  cancellation, status, recovery, and history views;
- protected staff request queue with approval, decline, activation, renewal,
  cancellation, date validation, and audit history;
- RLS, exact-role RPC grants, direct-write revocation, a RewardMe-specific
  mutation guard, one-pending-request enforcement, and immutable events;
- membership email templates and an automated operations release gate; and
- a staff SOP that keeps payments and sensitive credentials out of RewardMe.

Remaining approval and external gates:

1. Complete the commercial owner sign-off and legal/tax approval.
2. Approve which plan prices are reference terms and how any off-platform fees,
   receipts, taxes, renewals, cancellations, refunds, and disputes are handled.
3. Assign named staff who may review, approve, activate, change, and revoke plans.
4. Document identity checks, eligibility evidence, dual approval for sensitive
   changes, and an auditable reason for every activation or cancellation.
5. Test the public request form, operations review, activation, renewal reminder,
   cancellation, cross-tenant isolation, error recovery, and mobile workflows.
6. Keep card numbers and other payment credentials out of RewardMe forms, logs,
   database fields, support messages, and browser storage.
7. Activate Regular or Gold benefits only after the corresponding reward and
   referral rules have owner, accounting, and legal approval.

## Savings

1. Complete the savings section of the owner sign-off and obtain specialist legal review.
2. Apply `20260811084843_rewardme_savings_foundation.sql` only in an approved test project.
3. Implement audited, atomic lock/release/bonus/payout RPCs; direct ledger writes stay revoked.
4. Add reconciliation, statements, support corrections, maturity processing and alerts.
5. Add complete authenticated browser coverage and database concurrency tests.
6. Add `savingsPlans` to an approved plan entitlement and set the RewardMe
   program flag to true only after all release gates pass.

Removing an entitlement must prevent new enrollment while preserving the audit
history needed to reconcile existing memberships and savings records.
