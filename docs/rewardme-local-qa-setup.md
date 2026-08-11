# RewardMe local QA setup

This environment provides unlimited disposable test users and businesses without consuming production capacity.

## Prerequisites

1. Install Docker Desktop for Windows and enable its WSL 2 backend.
2. Start Docker Desktop and wait until the engine reports ready.
3. Open PowerShell in the repository.
4. Keep local QA credentials separate from production `.env`.

## Start and seed

```powershell
npx supabase start
npx supabase db reset
npx supabase status
```

The reset applies every migration and then loads `supabase/seed.sql`. Never run `db reset` against a linked production project.

Create `.env.local` from the local values printed by `supabase status`:

```text
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local anon key>
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local service-role key>
E2E_AUTH_ENABLED=true
E2E_PASSWORD=demo1234
```

## Run acceptance

In one terminal:

```powershell
npx supabase functions serve
```

In another:

```powershell
npm run test:e2e:acceptance
```

Run focused suites with `npm run test:referrals`, `test:onboarding`, `test:gift-cards`, `test:rewards`, and `test:agreements`.

## Reset and stop

Use `npx supabase db reset` whenever a workflow changes fixture state. Use `npx supabase stop` when finished. Local database contents are disposable and must never contain copied production personal information.

## Current workstation status

Docker was not installed on July 30, 2026, so authenticated local QA could not run. Resume from the prerequisite section after Docker Desktop is available.

