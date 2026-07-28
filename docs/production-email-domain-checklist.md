# Production email and authentication domains

The shared Supabase project must use neutral authentication templates. Tenant-specific application email continues to use each program's settings and verified sender.

## Supabase dashboard

1. Upload the templates from `supabase/email-templates`.
2. Add each HTTPS tenant origin and the paths in `tenant-email-redirect-matrix.json` to Authentication > URL Configuration.
3. Keep the platform subdomain URLs enabled while a custom domain is pending verification.
4. Configure a production SMTP provider. Do not use the Supabase trial sender for launch traffic.
5. Set rate limits appropriate to expected signup, recovery, and invitation traffic.

## DNS and sender verification

For every program marked `ready`:

- Verify the sending domain with the SMTP provider.
- Publish SPF and provider DKIM records.
- Publish DMARC in monitoring mode, review reports, then move to quarantine or reject.
- Configure a monitored reply-to and bounce address.
- Send signup, recovery, and invitation tests to Gmail, Outlook, and a custom-domain mailbox.
- Confirm links return to the originating tenant and never switch the active program.

Programs marked `pending` remain blocked from production email until their domain ownership and sender records are confirmed. Update the matrix only after those external checks pass.
