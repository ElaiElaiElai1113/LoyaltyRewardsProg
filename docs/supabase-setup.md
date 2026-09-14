# Supabase Setup Guide

## Current rewards project (verified 2026-09-14)

Loyalty Rewards Platforms: bftuvmywtmpflizsomim. RewardMe slug: pinas; Loyality slug: loyality. The retired retfuxpfstatpdsunkgj project is not a deployment target.

Run `node scripts/verify-rewards-supabase-target.mjs` before any database operation. It compares client/server configuration, CLI link and release target without printing keys. Run CLI commands sequentially on Windows.

The 20260908121931 integrity/retry migration is already deployed and recorded. Do not replay or repair it again. Use read-only history/schema checks and the integrity preflight before proposing any additive migration. Test new SQL only in an explicitly identified disposable local/test database, then obtain approval naming the exact production files and project. Do not blanket-push or reset the linked database.

Earlier setup instructions recommended broad push/reset and automatic history repair. Those instructions are superseded: history must be reconciled against actual schema evidence, one verified version at a time.

## Isolated local verification

The focused database runners accept only loopback and create/drop their own disposable database. Set LOYALITY_TEST_PSQL, LOYALITY_TEST_PGPORT and LOYALITY_TEST_PGUSER for your chosen local runtime. They never accept DATABASE_URL. Never use hosted customer data as test fixtures.

### 4. Create Demo Users

In Supabase Dashboard -> Authentication -> Users, create these users:

| Email | Password | app_metadata |
|-------|----------|-------------|
| `ava@example.com` | `Rewards 123!` | `{ "role": "customer" }` |
| `admin@medellinrewards.com` | `Rewards 123!` | `{ "role": "platform-admin" }` |
| `owner@velvetbrew.co` | `Rewards 123!` | `{ "role": "business-owner", "business_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }` |
| `owner@mysticcoffee.co` | `Rewards 123!` | `{ "role": "business-owner", "business_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" }` |

Set `role` in `app_metadata`, not `user_metadata`. The auth trigger reads from `app_metadata` when creating the profile row.

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials from Dashboard -> Settings -> API:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 6. Verify

```bash
npm run dev
npm run lint
npm run test
npm run build
```

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, the app uses Supabase. Otherwise it falls back to the localStorage mock store.

---

## Database Schema

### Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| `businesses` | Multi-tenant businesses | Everyone reads, admins manage |
| `profiles` | User profiles linked to auth.users | Own profile + admin/owner access |
| `reward_balances` | Points balances per user | Own balance + admin/owner access |
| `rewards` | Redeemable rewards per business | Everyone reads, owners manage own |
| `products` | Purchasable products per business | Everyone reads, owners manage own |
| `orders` | Customer orders | Own orders + owner sees their business |
| `order_line_items` | Items within orders | Inherits from orders |
| `promotions` | Promotional campaigns | Everyone reads, owners manage own |
| `activities` | Points activity log | Own activities + owner sees their business |
| `redemptions` | Reward redemption records | Own redemptions + owner sees their business |
| `admin_logs` | Audit trail | Platform admins only |

### Role-Based Access

| Action | Customer | Business Owner | Platform Admin |
|--------|----------|---------------|----------------|
| View businesses | Yes | Yes | Yes |
| Manage businesses | No | No | Yes |
| View own profile | Yes | Yes | Yes |
| View all profiles | No | No | Yes |
| View own balance | Yes | Yes | Yes |
| View all balances | No | No | Yes |
| View rewards/products | Yes | Yes | Yes |
| Manage own rewards | No | Yes | Yes |
| Manage all rewards | No | No | Yes |
| Place orders | Yes | No | Yes |
| View own orders | Yes | No | Yes |
| View business orders | No | Yes | Yes |
| View admin logs | No | No | Yes |

---

## Using Supabase CLI

Inspect `supabase --help` and command-specific help for the installed version. Use `supabase migration new <name>` to generate additive filenames. Read-only linked queries and migration listings do not authorize new remote changes. See the local candidate release guide for the exact ordered migration set.

## Migration Path from Mock Store

The app still supports a localStorage mock store fallback. To use Supabase end-to-end:

1. Set up Supabase with the CLI workflow above.
2. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Create the demo users or real tenant users in Supabase Auth.
4. Verify the critical flows against the linked database.

The service layer in `src/integrations/supabase/services/` is already structured to preserve the same frontend interface while swapping storage backends.
