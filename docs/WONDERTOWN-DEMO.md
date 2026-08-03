# Wondertown Rewards demo

Wondertown Rewards is the permanent fictional tenant used to demonstrate and
test the Rewards Platform without exposing or confusing data from Medellin,
Guatemala, or Pinas Rewards.

## Live address

`https://wondertown-rewards.vercel.app`

## Permanent test roles

| Role | Email | Purpose |
| --- | --- | --- |
| Member | `member@wondertown.test` | Browse businesses, products, rewards, gift cards, balance, profile, QR, and activity. |
| Neighbor | `neighbor@wondertown.test` | A second fictional customer visible in the Moonbeam Café customer list. |
| Business owner | `owner@wondertown.test` | Full Moonbeam Café management and transaction flow. |
| Business staff | `staff@wondertown.test` | Staff-level sale, redemption, and customer operations. |

All accounts use the existing protected `E2E_PASSWORD` value. Do not commit or
paste that password into this document.

## Seeded city

- Moonbeam Café
- Dragonfly Books
- Stardust Salon
- Lantern Hotel
- Cloud Nine Bakery

Each business has a product, reward, gift card, promotion, location, and earn
rate. The primary member starts with contact details, a QR code, a balance, an
activity entry, and a link to Moonbeam Café so authenticated tests can use the
complete real workflow immediately.

## Repeatable verification

1. `npm run qa:provision-wondertown`
2. `npm run test:e2e:wondertown-demo`

The provisioner is idempotent. It refreshes the demo password, fixture records,
tenant memberships, balances, and catalog data without creating duplicates.
