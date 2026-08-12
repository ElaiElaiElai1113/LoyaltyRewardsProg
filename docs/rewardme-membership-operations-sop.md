# RewardMe manual membership operations SOP

Status: **IMPLEMENTED FOR CONTROLLED QA — COMMERCIAL AND LEGAL APPROVAL REQUIRED BEFORE PUBLIC PAID LAUNCH**

RewardMe does not collect online payments or card details. This procedure covers
the controlled request, review, activation, renewal, and cancellation of Regular
and Gold access. It does not authorize a fee, refund, reward rate, or accounting
treatment that has not been approved in the commercial and legal registers.

## Roles and access

- Members may submit one pending enrollment or cancellation request, cancel their
  own pending request, and read their own status history.
- Platform administrators may review requests and manage active terms through
  `/admin/memberships`. Staff must use individual accounts; shared credentials
  are prohibited outside the temporary published QA accounts.
- Database service operations may apply controlled migrations. Browser clients
  cannot directly insert, update, or delete RewardMe membership records.
- Partner owners and business staff cannot approve RewardMe memberships.

## Enrollment

1. Ask the member to sign in, complete full name, email, and WhatsApp or phone,
   then open `/membership` and request Regular or Gold access.
2. Open `/admin/memberships` and compare the request with the member profile.
   Confirm the plan, contact details, eligibility evidence, and any approved
   off-platform fee evidence. Never copy card numbers or payment credentials into
   RewardMe.
3. Record a specific operations note. If the request is ineligible or evidence is
   incomplete, decline it with a clear reason and support path.
4. When approved, leave the end date blank for the plan default or enter the
   approved date. Regular defaults to one month and Gold to one year. The database
   rejects past dates and terms more than two years ahead.
5. Confirm the request is approved, the membership is active, and both entries
   appear in the audit history. Ask the member to refresh `/membership`.

## Renewal

1. Verify the member, current plan, current end date, approved renewal terms, and
   any required off-platform evidence.
2. Open the member's latest approved request, choose **Renew**, enter an audit
   note, and optionally set the approved end date.
3. The new date must extend the current term and cannot be more than two years
   from the operation date. Confirm the `membership renewed` audit entry.

## Cancellation

1. A member may submit a reason from `/membership`; staff may also cancel an
   active term for an approved operational reason.
2. Review identity, the requested effective treatment, the approved cancellation
   policy, unresolved disputes, and any required owner or legal escalation.
3. Approve the cancellation request, or choose **Cancel** on an active membership,
   and record the exact reason. Cancellation stops the active membership now; it
   does not delete the member, request, or audit history.
4. Confirm both the request decision and membership cancellation are visible in
   the audit history. Give the member the approved support response.

## Refunds and fee disputes

RewardMe does not take or refund an online payment. Staff must not promise or
record a refund as completed inside the membership screen. Locate the approved
off-platform receipt and payment owner, follow the final owner/legal refund rule,
record the external reference in the approved restricted system, and use only a
non-sensitive summary in the RewardMe operations note. Escalate chargebacks,
missing receipts, tax questions, or disputed fees to the named owner.

## Audit, privacy, and incidents

- Every request and staff decision writes an immutable event with member, actor,
  plan, old status, new status, reason, and timestamp.
- Never delete history to correct a mistake. Add the corrective operation and a
  note that references the earlier event.
- Keep notes factual and necessary. Do not enter passwords, government-ID images,
  card data, full bank details, or unrelated personal information.
- For suspicious access, cross-program data, duplicate changes, or a privacy
  concern, stop processing and follow the incident runbook.

## Notifications and release checks

The repository includes membership-request and membership-status email templates
with a safe link back to `/membership`. Automated delivery remains disabled until
RewardMe has a verified sender, SPF/DKIM/DMARC evidence, credentials, monitoring,
and an approved support owner. The in-app status and audit history are the source
of truth during QA.

Before release, run `npm run test:rewardme-membership-operations`, the unit suite,
the full Playwright suite, responsive checks, the migration release validation,
and the hosted RewardMe account checks. Retain the results with the release record.
