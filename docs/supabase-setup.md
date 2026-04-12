# Supabase Setup Guide

## Quick Start

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run Migrations

Copy the SQL from the migration files and run them in the Supabase SQL Editor (Dashboard → SQL Editor):

1. `supabase/migrations/20260412000000_schema.sql` — Tables, types, indexes, triggers
2. `supabase/migrations/20260412000001_rls_policies.sql` — Row Level Security policies
3. `supabase/migrations/20260412000002_auth_triggers.sql` — Auth triggers and helper functions
4. `supabase/seed.sql` — Seed data (businesses, products, rewards, promotions)

### 3. Create Demo Users

In Supabase Dashboard → Authentication → Users, create these users:

| Email | Password | app_metadata |
|-------|----------|-------------|
| `ava@cafecliche.co` | `demo1234` | `{ "role": "customer" }` |
| `admin@loyaltyplatform.co` | `demo1234` | `{ "role": "platform-admin" }` |
| `owner@cafecliche.co` | `demo1234` | `{ "role": "business-owner", "business_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" }` |
| `owner@mysticcoffee.co` | `demo1234` | `{ "role": "business-owner", "business_id": "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" }` |

**Important:** Set `role` in `app_metadata` (not `user_metadata`). The auth trigger reads from `app_metadata` to set the profile role.

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials (from Dashboard → Settings → API):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Verify

```bash
npm run dev
```

If `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, the app will use Supabase. If not, it falls back to the localStorage mock store.

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
| View businesses | ✅ | ✅ | ✅ |
| Manage businesses | ❌ | ❌ | ✅ |
| View own profile | ✅ | ✅ | ✅ |
| View all profiles | ❌ | ❌ | ✅ |
| View own balance | ✅ | ✅ | ✅ |
| View all balances | ❌ | ❌ | ✅ |
| View rewards/products | ✅ | ✅ | ✅ |
| Manage own rewards | ❌ | ✅ | ✅ |
| Manage all rewards | ❌ | ❌ | ✅ |
| Place orders | ✅ | ❌ | ✅ |
| View own orders | ✅ | ❌ | ✅ |
| View business orders | ❌ | ✅ | ✅ |
| View admin logs | ❌ | ❌ | ✅ |

---

## Using Supabase CLI (Optional)

If you install the Supabase CLI:

```bash
# Install
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Reset and re-seed
supabase db reset
```

---

## Migration Path from Mock Store

The current app uses a localStorage mock store. To switch to Supabase:

1. Set up Supabase (this guide)
2. Create new service files that use `supabase` client instead of `readStore()`
3. Update hooks to use the new services
4. The `isSupabaseConfigured` flag in `client.ts` allows graceful fallback

The service layer in `src/integrations/supabase/services/` is already structured for this migration — each service can be updated to use real Supabase queries while keeping the same interface.
