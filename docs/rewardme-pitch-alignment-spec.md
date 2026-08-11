# RewardMe pitch alignment specification

## Outcome

Replace the public-facing Pinas Rewards identity with RewardMe and align the
member acquisition experience with the approved RewardMe pitch. Preserve the
stable `pinas` tenant slug, UUID, Supabase scope, production hostname, route
structure, and existing authenticated workflows.

The supplied RewardMe landing-page image defines the visual direction: warm
cream surfaces, forest-green ink, restrained gold accents, editorial serif
headings, compact navigation, thin rules, and minimal card chrome. The
RewardMe pitch deck defines product behavior and takes precedence when mockup
copy conflicts with the deck.

## Evidence and current problems

- Production still identifies the tenant as `Pinas Rewards` in document
  metadata, the landing page, signup, legal pages, business acquisition, PWA
  install metadata, and tenant bootstrap data.
- The current landing page advertises PHP 1,000/month and PHP 4,000/year,
  while the approved deck defines Free at $0, Regular at $25/month, and Gold
  at $100/year.
- Current public copy promises immediate rewards and referral value during
  signup. The deck defines a three-month free trial with no rewards or referral
  payouts until the member converts to paid.
- The current business page describes only a 15%-25% commission model. The
  deck defines two participation paths: a commission model and a business-credit
  model, with RewardMe earning a 25% commission on rewards spent.
- The public shop exposes an authenticated QA fixture and uses Medellin map
  labels for the Philippines tenant.
- Several source strings contain mojibake such as `Â©`, `â€“`, and `â†’`.
- The current RewardMe/Pinas landing document is approximately 7,494px tall at
  the audited desktop viewport. Its information hierarchy repeats rewards and
  membership claims before explaining trial timing.

## Source-of-truth product rules

1. Final public name: RewardMe.
2. Positioning: a consumer subscription rewards program; "Membership that
   pays you back."
3. Paid membership fees are matched 100% in rewards.
4. Trial: three months of free access; no rewards or referral bonuses are paid
   during the trial; rewards begin immediately after conversion to paid.
5. Reward rates: most participating businesses offer at least 20% back for
   paid members; selected off-peak offers may reach 100%; high-ticket
   categories may offer less than 20%.
6. Tiers:
   - Free: $0, maximum 10% back, no referral bonuses, retroactive bonuses when
     upgraded where eligible.
   - Regular: $25/month, 20%-100% back by business, $10 in rewards per eligible
     referral, full platform access.
   - Gold: $100/year, full platform access, $25/month for three months when an
     eligible Regular referral converts, or $100 in rewards for an eligible
     Gold referral.
7. Businesses may participate through RewardMe-paid commissions or by issuing
   their own business credit. RewardMe earns a 25% commission on rewards spent.
8. Savings-plan messaging may explain locking reward value for a fixed term and
   the deck's double-payout/13th-month concept. It must not imply that a live
   enrollment or withdrawal workflow exists when it does not.
9. RewardMe may operate independently and may also receive reward funding from
   Synergize credits. The public member experience should not require members
   to understand Synergize.

## User journey and information hierarchy

1. Arrive on a compact RewardMe landing page.
2. Understand the value proposition and trial timing in the first viewport.
3. Choose one primary action: start the free access period by creating an
   account.
4. Inspect how earning, redemption, rates, savings, and tiers work lower on the
   page without encountering a fake control.
5. Continue to an existing route:
   - trial/account creation -> `/join`
   - store discovery -> `/shop`
   - business participation -> `/business`
   - existing member -> `/signin`
6. Receive honest loading, empty, error, and authentication-gated states on the
   destination route.

## Component and service changes

- Add a RewardMe-specific home component and stylesheet. Keep existing
  Medellin, Guatemala, and Wondertown home experiences intact.
- Change public Pinas display branding to RewardMe in tenant fallback data,
  bootstrap metadata, install metadata, migration-package display fields, and
  logo assets while retaining the `pinas` internal identifier and current
  hostname.
- Update public business acquisition copy for the two deck-defined business
  models and 25% commission.
- Add pitch-accurate trial language to the active member signup experience and
  its completion state.
- Align the authenticated membership explanation with the deck while keeping
  demo billing explicit. Do not create a real payment or savings mutation.
- Hide clearly marked QA-only businesses from anonymous public discovery while
  preserving them for authenticated release testing.
- Make the stylized partner map tenant-aware so RewardMe no longer displays
  Medellin neighborhoods.
- Replace mojibake in the touched public surfaces.

## Synergize alignment audit

The separate Synergize production application already communicates the core
deck loop: selected businesses monetize idle capacity, earn credits, spend
credits with other members, and pay a 25% platform fee in credit rather than
cash. It also keeps Synergize separate from RewardMe hosting and entitlements,
which matches the repository's existing isolation decision.

Remaining Synergize content gaps are outside this repository:

- The public site does not currently explain the city-by-city entity model or
  the founding partner/member packages from the deck.
- The homepage uses a strong "guarantee" claim about earning spent credit back;
  that wording is not established by the supplied pitch deck and should receive
  business/legal review.
- The member-offerings page is an honest empty state, but launch value will
  remain limited until approved partner inventory exists.

## Responsive and accessibility behavior

- Desktop content width is capped at 1,120px and uses the viewport efficiently.
- The first primary call to action remains in the first desktop viewport.
- Grids collapse to one column without fixed desktop heights.
- Controls remain at least 44px tall on touch layouts.
- No page-level horizontal overflow at 390px, 768px, or 1440px.
- Semantic landmarks, labelled navigation, descriptive image alternatives,
  visible focus styles, and reduced-motion handling are required.
- Example account activity is explicitly labelled illustrative so it is not
  mistaken for live user data.

## States and failures

- Signup and business contact keep their existing validation and error
  behavior.
- The public shop keeps loading, empty, and error-safe query behavior.
- If no real partners are available, the store shows an honest empty state and
  a working route back to account or business acquisition rather than test
  inventory.
- Payment and savings enrollment remain explicitly unavailable as live
  mutations. UI copy must not imply that a real charge, trial timer, savings
  deposit, or payout was created.
- Legacy support email and hostname may remain as infrastructure aliases until
  the client supplies approved RewardMe replacements; they should not be used
  as the visible brand name.

## Test strategy

- Source-contract tests for RewardMe tenant metadata, stable internal slug, and
  absence of public Pinas branding.
- Source-contract tests for exact pitch rules: trial timing, tiers, reward
  rates, business models, and 25% commission.
- Regression tests proving other tenants and Synergize isolation remain intact.
- Public dead-end tests for `/join`, `/shop`, `/business`, `/signin`, and legal
  routes.
- Focused unit tests, full static suite, lint, typecheck, production build, and
  Playwright/browser checks at desktop and mobile widths.

## Non-goals

- Renaming the `pinas` tenant slug, UUID, database foreign keys, storage paths,
  QA account identifiers, or current production hostname.
- Implementing Stripe or another live billing provider.
- Creating a live trial timer, payout engine, savings ledger, withdrawal flow,
  or direct Synergize-to-RewardMe credit transfer.
- Editing the separate Synergize Business Group repository or production data.
- Changing other tenant branding or authenticated business transaction rules.

## Rollback risks

- Renaming internal tenant identifiers would break host resolution and scoped
  data; therefore only display identity changes in this batch.
- Changing global membership RPC economics would affect every tenant; no global
  backend pricing mutation is included.
- Anonymous filtering must identify only the exact QA-fixture marker so real
  partners are never hidden.

## Acceptance criteria

- No public RewardMe surface displays `Pinas Rewards` as the program name.
- RewardMe landing, signup, membership explanation, and business acquisition
  agree with the deck's trial, tier, reward-rate, and participation rules.
- Every primary CTA reaches an existing functional route or a valid support
  contact.
- QA-only partner fixtures are not visible to anonymous visitors.
- RewardMe uses the supplied cream/green/gold editorial visual direction.
- Other tenants, routes, Supabase scoping, and the separate Synergize boundary
  remain unchanged.
- Targeted tests, full tests, lint, typecheck, build, desktop/mobile browser
  checks, overflow measurement, console review, and link checks pass.
