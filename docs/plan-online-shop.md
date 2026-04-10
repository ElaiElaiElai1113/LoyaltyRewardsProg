# Plan: Online Shop with Checkout

## Context

The loyalty platform currently only has a rewards catalog (points-based redemption). The project outline requires two separate systems: **Spending** (real money) and **Rewards** (points). The spending/shop side is completely missing.

This plan adds an online shop where customers browse products, add to cart, check out with simulated payment, and automatically earn reward points from purchases.

---

## Design Decisions

- **Simulated payment** — mock checkout, no real payment processing
- **Configurable earn rate** — admin sets points-per-dollar (default: 10 pts/$1)
- **Immediate availability, "processing" display** — points added to balance immediately, but Activity entry shows as `pending` with "Processing - available within 24 hours" badge
- **Cart in separate localStorage key** — ephemeral cart state, not mixed with domain data
- **Products are separate from Rewards** — products have dollar prices, rewards have point costs

---

## New Data Models

```
Product       — id, title, description, category, price, inventory, featured, highlight
CartItem      — productId, quantity (stored in separate localStorage key)
Order         — id, profileId, items[], subtotal, tax, total, pointsEarned, pointsStatus, paymentMethod, status, createdAt
OrderLineItem — productId, productTitle, unitPrice, quantity, subtotal
StoreSettings — earnRate (pts/$1), taxRate, currency
```

---

## Files to Create (11 new)

### Services (4)

| File | Purpose |
|------|---------|
| `src/integrations/supabase/services/products-service.ts` | CRUD for products |
| `src/integrations/supabase/services/cart-service.ts` | Add/remove/update cart items |
| `src/integrations/supabase/services/orders-service.ts` | Place order, calculate points, update inventory |
| `src/integrations/supabase/services/settings-service.ts` | Get/update store settings |

### Components (2)

| File | Purpose |
|------|---------|
| `src/features/shop/components/product-card.tsx` | Product card with price + "Add to Cart" button |
| `src/features/shop/components/cart-item-row.tsx` | Cart row with quantity controls and line total |

### Pages (5)

| File | Route | Purpose |
|------|-------|---------|
| `src/features/shop/pages/shop-page.tsx` | `/shop` | Product catalog with category filters |
| `src/features/shop/pages/cart-page.tsx` | `/cart` | Shopping cart with order summary |
| `src/features/shop/pages/checkout-page.tsx` | `/checkout` | Simulated payment + place order |
| `src/features/shop/pages/order-confirmation-page.tsx` | `/order-confirmation` | Success page with points earned |
| `src/features/shop/pages/orders-page.tsx` | `/orders` | Order history |

---

## Files to Modify (8 existing)

| File | Change |
|------|--------|
| `src/types/domain.ts` | Add Product, CartItem, Order, OrderLineItem, StoreSettings interfaces; extend MockStore |
| `src/lib/mock-store.ts` | Add seed products (6 items), storeSettings, cart utilities (readCart/writeCart/clearCart) |
| `src/types/forms.ts` | Add productDraftSchema, storeSettingsSchema, checkoutSchema |
| `src/hooks/use-customer-data.ts` | Add query keys + hooks for products, cart, orders, place order |
| `src/hooks/use-admin-data.ts` | Add hooks for product CRUD, store settings |
| `src/routes/router.tsx` | Add 5 new customer routes |
| `src/layouts/customer-layout.tsx` | Add "Shop" nav link + cart icon with count badge |
| `src/features/admin/pages/admin-page.tsx` | Add Products tab (CRUD) and Settings tab (earn rate, tax rate) |

---

## Implementation Order

### Step 1: Data Foundation

- Extend `src/types/domain.ts` with new interfaces + MockStore
- Extend `src/lib/mock-store.ts` with seed data + cart utilities

### Step 2: Forms + Utils

- Add Zod schemas to `src/types/forms.ts` (productDraft, storeSettings, checkout)

### Step 3: Services (in dependency order)

1. `products-service.ts`
2. `cart-service.ts`
3. `settings-service.ts`
4. `orders-service.ts` (depends on all above — orchestrates checkout)

### Step 4: Hooks

- Extend `src/hooks/use-customer-data.ts` with shop/cart/order hooks
- Extend `src/hooks/use-admin-data.ts` with product/settings hooks

### Step 5: Customer UI

- Build `product-card.tsx` + `cart-item-row.tsx` components
- Build pages: shop → cart → checkout → order-confirmation → orders

### Step 6: Routing + Navigation

- Add 5 routes to `src/routes/router.tsx`
- Update `src/layouts/customer-layout.tsx` with Shop link + cart badge

### Step 7: Admin Extensions

- Add Products and Settings tabs to `src/features/admin/pages/admin-page.tsx`

---

## Reward Points Flow

```
Customer browses /shop → adds items to cart → /cart reviews order
  → /checkout selects payment → places order
    → points calculated: total × earnRate
    → order created with line items
    → points added to balance (immediate)
    → activity logged as 'pending' ("Processing - available within 24 hours")
    → product inventory decremented
    → cart cleared
  → /order-confirmation shows success + points earned
```

---

## Verification Checklist

- [ ] `npm run dev` — no build errors
- [ ] Customer: Shop page shows 6 seed products with prices
- [ ] Customer: Add to cart updates badge count
- [ ] Customer: Cart page shows items, subtotal, tax, total, estimated points
- [ ] Customer: Checkout completes and redirects to confirmation
- [ ] Customer: Activity page shows new "earned" entry with "Processing" badge
- [ ] Customer: Orders page shows order history
- [ ] Customer: Balance updated with earned points
- [ ] Admin: Products tab shows products, can add new ones
- [ ] Admin: Settings tab shows earn rate and tax rate, can update
