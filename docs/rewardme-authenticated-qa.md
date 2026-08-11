# RewardMe authenticated QA

The RewardMe authenticated smoke suite uses a unique temporary member. It tests
the real Supabase authentication boundary, RewardMe program membership and
balance isolation, the agreement gate or member shell, mobile overflow, runtime
errors, and HTTP 5xx responses. It then signs out and deletes every user it
created, even when a test fails.

## Safe run requirements

- Use an isolated QA Supabase project or an explicitly approved production-safe
  window; never point seeded mutation workflows at production.
- Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` in the local `.env`. Never commit these values.
- Confirm the `medellin`, `guatemala`, and `pinas` programs exist because the
  suite verifies cross-tenant isolation.
- Run one worker so temporary-user setup and cleanup remain serial.

Run:

`npm run test:e2e:rewardme-safe`

The command fails closed when browser credentials are absent. The suite does not
add a demo-mode flag, bypass authorization, seed permanent accounts, change
commercial settings, or activate billing. If cleanup reports an error, delete
the named `e2e-hosted-*` user through the approved Supabase admin process before
the next run and retain the failure trace.

## Release evidence

Retain the command output and Playwright trace with the release record. A skipped
or credential-blocked run is not a pass; the launch dashboard must remain
`External input required` until a credentialed run succeeds.
