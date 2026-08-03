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

## Boss-ready login message

Send the password through a private channel, separately from this message.

### English

> Wondertown Rewards is our fictional, working demo city. It is safe to use for
> testing because its people and businesses are not real client data.
>
> Open: https://wondertown-rewards.vercel.app
>
> To test as a member, use `member@wondertown.test` and the private demo
> password. To test as a business owner, use `owner@wondertown.test` and the
> same password. A staff account is also available at `staff@wondertown.test`.
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
> Para probar como miembro, usa `member@wondertown.test` y la contraseña privada
> de demostración. Para probar como dueño de negocio, usa
> `owner@wondertown.test` y la misma contraseña. También hay una cuenta de
> empleado: `staff@wondertown.test`.
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

The provisioner is idempotent. It refreshes the demo password, fixture records,
tenant memberships, balances, and catalog data without creating duplicates.
