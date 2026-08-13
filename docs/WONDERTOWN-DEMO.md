# Wondertown Rewards demo

Wondertown Rewards is the permanent fictional tenant used to demonstrate and
test the Rewards Platform without exposing or confusing data from Medellin,
Guatemala, or RewardMe.

## Live address

`https://wondertown-rewards.vercel.app`

## Permanent test roles

| Role | Email | Purpose |
| --- | --- | --- |
| Member | `member@wondertown.test` | Browse businesses, products, rewards, gift cards, balance, profile, QR, and activity. |
| Neighbor | `neighbor@wondertown.test` | A second fictional customer visible in the Moonbeam Café customer list. |
| Business owner | `owner@wondertown.test` | Full Moonbeam Café management and transaction flow. |
| Business staff | `staff@wondertown.test` | Staff-level sale, redemption, and customer operations. |
| Platform admin | `admin@rewardsplatform.test` | Platform administration and Wondertown tenant oversight. |

Password for every test account: `Rewards 123!`

## Boss-ready login message

### English

> Wondertown Rewards is our fictional, working demo city. It is safe to use for
> testing because its people and businesses are not real client data.
>
> Open: https://wondertown-rewards.vercel.app
>
> To test as a member, use `member@wondertown.test`. To test as a business
> owner, use `owner@wondertown.test`. A staff account is available at
> `staff@wondertown.test`. The password for every test account is
> `Rewards 123!`.
>
> Suggested test: sign in as the member and open the QR code. In a private or
> second browser window, sign in as the business owner or staff member, find
> the member, record a purchase, and confirm that the member's balance and
> activity update. You can also test products, rewards, gift cards, customer
> registration, and redemptions.

### Español

> Wondertown Rewards es nuestra ciudad ficticia y funcional para demostraciones.
> Se puede usar con seguridad para pruebas porque sus personas y negocios no
> contienen datos reales de clientes.
>
> Abrir: https://wondertown-rewards.vercel.app
>
> Para probar como miembro, usa `member@wondertown.test`. Para probar como dueño
> de negocio, usa `owner@wondertown.test`. También hay una cuenta de empleado:
> `staff@wondertown.test`. La contraseña para todas las cuentas de prueba es
> `Rewards 123!`.
>
> Prueba sugerida: inicia sesión como miembro y abre el código QR. En una ventana
> privada o en un segundo navegador, inicia sesión como dueño o empleado, busca
> al miembro, registra una compra y confirma que el saldo y la actividad del
> miembro se actualicen. También puedes probar productos, recompensas, tarjetas
> de regalo, registro de clientes y canjes.

## Demonstration checklist

1. Open the public homepage and confirm Wondertown branding is visible before
   signing in.
2. Sign in as the member and review businesses, offers, reward balance,
   contact details, activity, and the member QR code.
3. In a separate private browser session, sign in as owner or staff.
4. Search for the member, record a sale, and verify the member's updated points.
5. Redeem a reward or gift card as the member and fulfill it as the business.
6. Register a new fictional customer and verify the customer appears in the
   business customer list with a generated customer ID.
7. Sign out of both roles so the next tester begins from a clean session.

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
3. `npm run test:e2e:wondertown-gift-cards-live`
4. `npm run qa:verify-reward-sites`

The provisioner is idempotent. A normal refresh repairs the demo password,
accounts, memberships, missing balances, catalogs, baseline transaction, and
baseline gift card without creating duplicates or erasing later test activity.

## Safe reset and automatic repair

Use `npm run qa:refresh-wondertown` for a production refresh using the Supabase
credential already stored on the release workstation. It preserves transaction,
gift-card, redemption, and balance history.

Use `npm run qa:reset-wondertown` only when the demo must return to its clean
baseline. The command asks for confirmation and deletes only records whose
`program_id` is Wondertown. It keeps all other rewards programs, the Wondertown
program/domain/settings/subscription, and permanent authentication identities.
After clearing the fictional tenant, it restores the five businesses, four user
roles, balances, customer links, catalogs, one baseline member transaction, and
one baseline gift card.

For a reset followed immediately by authenticated and gift-card Playwright
checks, run:

`powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/reset-wondertown-demo.ps1 -RunAuthenticatedChecks -RunGiftCardChecks`

The `Production operations` GitHub workflow can run this every six hours. Once
`ENABLE_REWARD_SITES_DEEP_MONITORING=true` is configured, it performs a
non-destructive Wondertown refresh and then checks RewardMe and Wondertown site
health, published logins, tenant roles, map coordinates, catalogs, balances,
customer links, transactions, and gift cards. Its manual `reset_wondertown`
input provides the same Wondertown-only reset for authorized operators. The job
is fail-closed and remains disabled until its encrypted secrets are configured.

Required repository secrets are `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `E2E_PASSWORD`.
The service-role key stays in server-side automation and is never bundled into
either website.
