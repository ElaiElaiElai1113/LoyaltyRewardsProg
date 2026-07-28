# Privacy operations runbook

## Access export

Confirm the requester’s identity and program memberships. Run `npm run ops:user:export -- -UserId <uuid>`, review the generated manifest, deliver through an approved encrypted channel, and record completion without attaching personal data to tickets.

## Account deletion

Confirm identity, legal retention requirements, active balances, gift cards, transactions, agreements, and open disputes. Use the existing platform-admin deletion workflow only after approval. Revoke authentication access and anonymize eligible profile fields.

## Financial records

Financial records, agreement evidence, fraud controls, and required audit records must not be cascade-deleted. Retain or anonymize them according to the applicable program policy and jurisdiction.

Exports under `artifacts/privacy-exports` are sensitive, ignored operational evidence. Never commit or email them unencrypted.
