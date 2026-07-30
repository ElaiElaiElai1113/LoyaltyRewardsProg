# Pinas Rewards QA account register

Do not store passwords in this file or commit them to Git. Keep credentials in an approved password manager or ignored local environment file.

| Role | Environment variable | Purpose | Status |
|---|---|---|---|
| Verified customer | `E2E_CUSTOMER_EMAIL` | Core member workflow | Blocked: Pinas member limit |
| Unverified customer | `E2E_UNVERIFIED_CUSTOMER_EMAIL` | Restricted-value actions | Blocked: Pinas member limit |
| Business owner | `E2E_BUSINESS_OWNER_EMAIL` | Partner administration | Blocked: no Pinas business slot |
| Business staff | `E2E_BUSINESS_STAFF_EMAIL` | QR sales and redemption | Blocked: no Pinas business slot |
| Platform administrator | `E2E_ADMIN_EMAIL` | Operational controls | Existing isolated fixture can be reset |
| Pending member agreement | `E2E_AGREEMENT_PENDING_CUSTOMER_EMAIL` | E-signature gate | Blocked: Pinas member limit |
| Pending partner agreement | `E2E_AGREEMENT_PENDING_BUSINESS_OWNER_EMAIL` | Partner e-signature gate | Blocked: no Pinas business slot |

Production QA users must:

- use clearly isolated `qa+...` addresses;
- never reuse real customer or employee accounts;
- use a randomly generated password;
- be attached only to the Pinas program and a designated QA business;
- be removed or disabled after launch acceptance.

The `npm run qa:reset-passwords` helper resets only existing isolated fixtures by default. Creating missing users, creating a QA business, or assigning program memberships each requires its own explicit environment flag so a routine password reset cannot consume tenant capacity accidentally.

## Current production constraint

On July 30, 2026, production returned `members_limit_reached` and `businesses_limit_reached` while preparing isolated Pinas fixtures. Do not bypass these controls or attach Pinas QA identities to another tenant's business. Acceptance can resume after an existing Pinas member/business slot is freed or the Pinas subscription entitlement is legitimately increased.
