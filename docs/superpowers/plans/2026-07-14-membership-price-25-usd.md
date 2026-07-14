# Membership Price $25 USD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the demo monthly membership fee from $10 USD to $25 USD while keeping the instant reward credit at $10.

**Architecture:** Define the two monetary values as separate frontend constants so fee and credit cannot be confused in the UI. Add a forward-only Supabase migration that changes the persisted mock fee to `2500` cents but leaves every credit grant at `1000` cents.

**Tech Stack:** React 19, TypeScript, Supabase/PostgreSQL, Node test runner, ESLint, Vite

---

## File Structure

- Create `src/features/membership/membership-pricing.ts`: shared membership fee and reward-credit constants.
- Create `supabase/migrations/20260714000000_membership_price_25_usd.sql`: forward database update for existing and future mock memberships.
- Modify `src/features/membership/pages/membership-page.tsx`: render the $25 fee and retain the $10 credit.
- Modify `src/features/membership/components/membership-banner.tsx`: advertise $25/month with $10 instant credit.
- Modify `src/features/membership/components/earn-redeem-gate.tsx`: show $25 in the Monthly card and $10 in the Instant credit card.
- Modify `src/lib/language.tsx`: translate the new price strings.
- Modify `docs/complete-role-walkthrough.md`: update the documented demo fee.
- Modify `tests/run-tests.ts`: guard the fee/credit distinction across UI and SQL.

### Task 1: Change the Monthly Membership Fee Without Changing Its Credit

**Files:**
- Create: `src/features/membership/membership-pricing.ts`
- Create: `supabase/migrations/20260714000000_membership_price_25_usd.sql`
- Modify: `src/features/membership/pages/membership-page.tsx`
- Modify: `src/features/membership/components/membership-banner.tsx`
- Modify: `src/features/membership/components/earn-redeem-gate.tsx`
- Modify: `src/lib/language.tsx`
- Modify: `docs/complete-role-walkthrough.md`
- Test: `tests/run-tests.ts`

- [ ] **Step 1: Add the failing fee-versus-credit source contract**

Add this test to `tests/run-tests.ts`:

```ts
runTest('membership charges $25 USD monthly and keeps the $10 instant credit', () => {
  const page = readFileSync('src/features/membership/pages/membership-page.tsx', 'utf8')
  const banner = readFileSync('src/features/membership/components/membership-banner.tsx', 'utf8')
  const gate = readFileSync('src/features/membership/components/earn-redeem-gate.tsx', 'utf8')
  const pricing = readFileSync('src/features/membership/membership-pricing.ts', 'utf8')
  const language = readFileSync('src/lib/language.tsx', 'utf8')
  const migration = readFileSync('supabase/migrations/20260714000000_membership_price_25_usd.sql', 'utf8')

  assert.match(pricing, /MEMBERSHIP_PRICE_CENTS = 2500/)
  assert.match(pricing, /MEMBERSHIP_REWARD_CREDIT_CENTS = 1000/)
  assert.match(page, /\$25\/mo flat/)
  assert.match(banner, /\$25\/mo membership, \$10 credit instantly/)
  assert.match(gate, /formatCurrency\(MEMBERSHIP_PRICE_USD\)/)
  assert.match(language, /'\$25\/mo flat': '\$25\/mes fijo'/)
  assert.match(migration, /price_cents = 2500/)
  assert.match(migration, /grant_membership_credit\(actor_id, 1000\)/)
})
```

- [ ] **Step 2: Run the test suite and verify the new contract fails**

Run: `npm test`

Expected: FAIL because the pricing module and forward migration do not exist yet.

- [ ] **Step 3: Add separate fee and credit constants**

Create `src/features/membership/membership-pricing.ts`:

```ts
export const MEMBERSHIP_PRICE_CENTS = 2500
export const MEMBERSHIP_PRICE_USD = MEMBERSHIP_PRICE_CENTS / 100
export const MEMBERSHIP_REWARD_CREDIT_CENTS = 1000
export const MEMBERSHIP_REWARD_CREDIT_USD = MEMBERSHIP_REWARD_CREDIT_CENTS / 100
```

- [ ] **Step 4: Use the $25 fee in membership UI while retaining the $10 credit**

In `membership-page.tsx`, import the shared values, change `'$10/mo flat'` to `'$25/mo flat'`, use `MEMBERSHIP_PRICE_CENTS` as the missing-record fallback, render the side-card price with `formatCurrency(MEMBERSHIP_PRICE_USD)`, and render instant credit with `MEMBERSHIP_REWARD_CREDIT_USD`.

In `membership-banner.tsx`, change the translatable heading to:

```tsx
{t('$25/mo membership, $10 credit instantly')}
```

In `earn-redeem-gate.tsx`, render the Monthly card with:

```tsx
{formatCurrency(MEMBERSHIP_PRICE_USD)}
```

and the Instant credit card with:

```tsx
{formatCurrency(MEMBERSHIP_REWARD_CREDIT_USD)}
```

- [ ] **Step 5: Update English/Spanish price strings and documentation**

Replace only the fee-bearing translation entries with:

```ts
'$25/mo flat': '$25/mes fijo',
'$25/mo membership, $10 credit instantly': 'Membresia de $25/mes, credito de $10 al instante',
```

Change the role walkthrough's `$10/mo` demo membership reference to `$25/mo`. Leave all $10 credit wording unchanged.

- [ ] **Step 6: Add a forward database migration**

Create `supabase/migrations/20260714000000_membership_price_25_usd.sql` that:

```sql
alter table public.memberships
  alter column price_cents set default 2500;

update public.memberships
set price_cents = 2500
where provider = 'mock'
  and currency = 'USD'
  and price_cents = 1000;
```

Then recreate `public.mock_subscribe()` and `public.mock_renew()` from the existing membership migration with every membership `price_cents` value changed to `2500`, while keeping both calls to `public.grant_membership_credit(actor_id, 1000)` unchanged. Reapply authenticated execute grants for both RPCs.

- [ ] **Step 7: Run the contract and full verification**

Run: `npm test`

Expected: PASS, including `membership charges $25 USD monthly and keeps the $10 instant credit`.

Run: `npx eslint src/features/membership/membership-pricing.ts src/features/membership/pages/membership-page.tsx src/features/membership/components/membership-banner.tsx src/features/membership/components/earn-redeem-gate.tsx tests/run-tests.ts`

Expected: PASS with no lint errors.

Run: `npm run build`

Expected: PASS and Vite emits the production bundle.

Run: `git diff --check`

Expected: no output and exit code 0.

- [ ] **Step 8: Commit the implementation**

```powershell
git add -- src/features/membership/membership-pricing.ts src/features/membership/pages/membership-page.tsx src/features/membership/components/membership-banner.tsx src/features/membership/components/earn-redeem-gate.tsx src/lib/language.tsx supabase/migrations/20260714000000_membership_price_25_usd.sql docs/complete-role-walkthrough.md tests/run-tests.ts
git commit -m "feat: update membership price to 25 USD"
```
