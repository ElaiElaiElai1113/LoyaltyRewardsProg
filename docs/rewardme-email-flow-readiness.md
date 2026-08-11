# RewardMe authentication email readiness

Status: **AUTOMATED FLOW VERIFICATION COMPLETE — EXTERNAL DELIVERY CHECKS PENDING**

The repository verifies the following with `npm run test:email-readiness`:

- password-reset recipients are trimmed and normalized;
- recovery links return to `/reset-password`;
- invitation links use `/accept-invitation` on a verified program domain;
- recovery and invitation links establish only the expected setup session;
- PKCE codes are exchanged before an existing browser session is trusted;
- password changes use the authenticated Supabase session;
- recovery, invitation, and confirmation templates retain secure action links;
- shared Supabase templates contain no RewardMe legacy branding.

The production-safe provisioning check can also verify a server-generated
recovery link without logging or sending its token:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/provision-rewardme-production-qa.ps1 -RunAuthenticatedChecks
```

The remaining checks require organization-controlled mailboxes or DNS/provider
access: delivery to Gmail, Outlook, and Yahoo; sender/reply-to behavior; bounce
handling; SPF, DKIM, and DMARC alignment; and support-mailbox monitoring.
