# RewardMe operations runbook

## Daily checks

- Open the public homepage and health endpoint.
- Confirm database status is `reachable`.
- Review browser monitoring and failed emails.
- Review unusually high reward issuance, repeated QR use, pending redemptions, and unpaid commissions.
- Confirm the support queue has an owner.

## Reward adjustment

Require a transaction reference, reason, requested delta, evidence, and approver. Use the administrative adjustment feature; never edit database balances manually. Record who approved and performed the change.

## Refund or reversal

Confirm the partner refund, locate the original transaction, calculate the linked reward and commission reversal, notify the member where appropriate, and retain an audit note. Never create a compensating duplicate sale.

## Partner settlement

Export the period ledger, reconcile transactions and reversals, obtain partner confirmation, issue the correct invoice or statement, record payment reference, and mark commission paid only after funds are confirmed.

## Privacy request

Log the request, verify identity proportionately, identify affected systems, apply preservation requirements, export/correct/delete eligible information, coordinate processors, and confirm completion. Follow the reviewed Privacy Notice and deletion policy.

## Incident response

1. Classify severity and assign an incident lead.
2. Preserve logs and stop further harm without destroying evidence.
3. Restrict compromised access and rotate affected credentials.
4. Assess members, partners, data, rewards, and financial impact.
5. Notify the owner, privacy contact, counsel, vendors, and affected people when required.
6. Restore safely and monitor.
7. Publish a factual internal timeline and corrective actions.

Do not speculate publicly or include personal information in shared incident channels.

