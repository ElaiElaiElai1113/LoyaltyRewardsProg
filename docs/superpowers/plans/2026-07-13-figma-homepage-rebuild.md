# Figma Homepage Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the supplied Figma export as the exact-wording, responsive main homepage at `/` while retaining `/landing-page` as a compatibility route.

**Architecture:** Add a focused `HomePage` React component and a scoped stylesheet so the large existing authentication page file remains untouched. Route both `/` and `/landing-page` to the new component, use copied local Figma assets for all photography, and preserve existing application routes for member and business CTAs.

**Tech Stack:** React 19, TypeScript, React Router, CSS, Lucide React, Vite, Playwright

---

## File Structure

- Create `src/features/home/pages/home-page.tsx`: semantic homepage structure, exact copy, image imports, CTA routing, and FAQ disclosure state.
- Create `src/features/home/pages/home-page.css`: landing-only visual tokens, desktop fidelity, responsive layout, hover/focus behavior, and reduced-motion handling.
- Create `src/assets/landing/coffee-member.png`: supplied square coffee-shop hero photo.
- Create `src/assets/landing/coffee-rewards.png`: supplied coffee-shop category photo.
- Create `src/assets/landing/dinner-rewards.png`: supplied dinner category photo.
- Create `src/assets/landing/salon-rewards.png`: supplied salon category photo.
- Create `src/assets/landing/real-estate-rewards.png`: supplied real-estate category photo.
- Modify `src/routes/router.tsx`: render `HomePage` for `/` and `/landing-page`.
- Modify `tests/e2e/public.spec.ts`: assert the root route, exact Figma wording, navigation, membership copy, and FAQ state.
- Modify `src/index.css`: remove obsolete `.screenshot-landing` overrides only after the routed legacy page is no longer used.

### Task 1: Lock the Homepage Contract with a Failing Browser Test

**Files:**
- Modify: `tests/e2e/public.spec.ts`

- [ ] **Step 1: Replace the old landing assertions with the Figma homepage contract**

```ts
test('Figma homepage is the main public landing page', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', {
    name: 'Earn Amazing Rewards While Supporting Local Businesses',
  })).toBeVisible()
  await expect(page.getByText('Every purchase becomes a Reward')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Choose how you earn' })).toBeVisible()
  await expect(page.getByText('$100,000 COP', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Your dream vacation. Already paid for.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Businesses' })).toHaveAttribute('href', '/business')
  await expect(page.getByRole('link', { name: 'Join now' }).first()).toHaveAttribute('href', '/join')

  const expandedFaq = page.getByText('Can I have more than one Rewards account?').locator('..')
  await expect(expandedFaq).toHaveAttribute('open', '')
  await expect(page.getByText('No. Each person can have one Rewards account, tied to your full name, email, and phone number.')).toBeVisible()
})

test('legacy landing URL renders the same homepage', async ({ page }) => {
  await page.goto('/landing-page')
  await expect(page.getByRole('heading', {
    name: 'Earn Amazing Rewards While Supporting Local Businesses',
  })).toBeVisible()
})
```

- [ ] **Step 2: Run the focused test and confirm it fails for the old root page**

Run: `npx playwright test tests/e2e/public.spec.ts --grep "Figma homepage|legacy landing"`

Expected: FAIL because `/` still renders `EarlyAccessPage`, and the Figma headings do not exist.

- [ ] **Step 3: Commit the contract test**

```powershell
git add -- tests/e2e/public.spec.ts
git commit -m "test: define Figma homepage contract"
```

### Task 2: Add Local Figma Assets and the Semantic Homepage

**Files:**
- Create: `src/assets/landing/coffee-member.png`
- Create: `src/assets/landing/coffee-rewards.png`
- Create: `src/assets/landing/dinner-rewards.png`
- Create: `src/assets/landing/salon-rewards.png`
- Create: `src/assets/landing/real-estate-rewards.png`
- Create: `src/features/home/pages/home-page.tsx`
- Create: `src/features/home/pages/home-page.css`

- [ ] **Step 1: Copy the supplied image assets under stable filenames**

```powershell
New-Item -ItemType Directory -Force src/assets/landing
Copy-Item 'figma images/Member enjoying rewards at a local coffee shop.png' 'src/assets/landing/coffee-member.png'
Copy-Item 'figma images/Member earning rewards at a coffee shop.png' 'src/assets/landing/coffee-rewards.png'
Copy-Item 'figma images/Couple earning rewards at dinner.png' 'src/assets/landing/dinner-rewards.png'
Copy-Item 'figma images/Member earning rewards at a hair salon.png' 'src/assets/landing/salon-rewards.png'
Copy-Item 'figma images/Couple earning rewards on real estate.png' 'src/assets/landing/real-estate-rewards.png'
```

- [ ] **Step 2: Create the homepage content model and semantic section structure**

The component defines the exact Figma content as immutable arrays, imports the five images, and renders these IDs in order: `top`, `rewards`, `membership`, `how-it-works`, `vacation`, `faq`, `suggest`, `footer`.

```tsx
import { ChevronRight, Coffee, CreditCard, Gift, MapPin, Scissors, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'

import coffeeMember from '@/assets/landing/coffee-member.png'
import coffeeRewards from '@/assets/landing/coffee-rewards.png'
import dinnerRewards from '@/assets/landing/dinner-rewards.png'
import realEstateRewards from '@/assets/landing/real-estate-rewards.png'
import salonRewards from '@/assets/landing/salon-rewards.png'
import './home-page.css'

const categoryImages = [
  { src: coffeeRewards, alt: 'Member earning rewards at a coffee shop', label: 'Coffee runs' },
  { src: dinnerRewards, alt: 'Couple earning rewards at dinner', label: 'Dining out' },
  { src: salonRewards, alt: 'Member earning rewards at a hair salon', label: 'Salon days' },
  { src: coffeeMember, alt: 'Family earning rewards on a car purchase', label: 'Cars' },
  { src: realEstateRewards, alt: 'Couple earning rewards on real estate', label: 'Real estate' },
] as const

const faqs = [
  { question: 'Where can I use my Rewards?', answer: null },
  {
    question: 'Can I have more than one Rewards account?',
    answer: 'No. Each person can have one Rewards account, tied to your full name, email, and phone number.',
    open: true,
  },
  { question: 'Can I transfer Rewards to another account?', answer: null },
  { question: 'Can Rewards be exchanged for money?', answer: null },
] as const

export function HomePage() {
  return (
    <main className="figma-home" id="top">
      <header className="figma-home__header">
        <a href="#top">MEDELLIN REWARDS</a>
        <nav aria-label="Primary navigation">
          <a href="#how-it-works">How it works</a>
          <Link to="/business">Businesses</Link>
          <a href="#faq">FAQ</a>
          <Link to="/join">Join now</Link>
        </nav>
      </header>
      <section className="figma-home__hero">
        <h1>Earn Amazing Rewards While <em>Supporting Local</em> Businesses</h1>
        <p>Every time you shop, dine, or spend at a business in our network, you're supporting a local business — and earning Rewards you can actually use.</p>
        <p>Join free and earn 10% back automatically — or upgrade to earn between 20% and 100% back — every time you spend with the businesses in our network.</p>
        <Link to="/join">Join Medellin Rewards</Link>
        <a href="#how-it-works">See how it works</a>
        <img src={coffeeMember} alt="Member enjoying rewards at a local coffee shop" />
      </section>
      <section className="figma-home__rewards" id="rewards">
        <h2>Every purchase becomes a Reward</h2>
        {categoryImages.map((image) => <figure key={image.label}><img src={image.src} alt={image.alt} /><figcaption>{image.label}</figcaption></figure>)}
      </section>
      <section className="figma-home__membership" id="membership">
        <p>MEMBERSHIP</p><h2>Choose how you earn</h2>
        <article><h3>Free Membership</h3><p>$0</p><Link to="/join">Join Free →</Link></article>
        <article><h3>Regular Membership</h3><p>$100,000 COP</p><Link to="/join">Upgrade →</Link></article>
      </section>
      <section className="figma-home__process" id="how-it-works">
        <p>THE PROCESS</p><h2>How it works</h2>
        <article><h3>Join</h3></article><article><h3>Spend &amp; earn</h3></article><article><h3>Redeem</h3></article>
      </section>
      <section className="figma-home__vacation" id="vacation">
        <p>REDEEM</p><h2>Your dream vacation. Already paid for.</h2><Link to="/join">Start earning today</Link>
      </section>
      <section className="figma-home__faq" id="faq">
        <p>GOOD TO KNOW</p><h2>Frequently asked questions</h2>
        {faqs.map((faq) => <details key={faq.question} open={faq.open}><summary>{faq.question}</summary>{faq.answer ? <p>{faq.answer}</p> : null}</details>)}
      </section>
      <section className="figma-home__suggest" id="suggest">
        <h2>Don't see one of your favourite businesses?</h2><p>Refer them to us, and if they join, you'll earn Rewards.</p><Link to="/business">Suggest a business →</Link>
      </section>
      <footer className="figma-home__footer">
        <a href="#top">MEDELLIN REWARDS</a><p>Earn amazing rewards while supporting local businesses.</p>
        <Link to="/privacy">Privacy policy</Link><Link to="/terms">Contact</Link>
        <p>© 2026 Medellin Rewards. All rights reserved.</p><p>Made for members in Medellin, Colombia</p>
      </footer>
    </main>
  )
}
```

Add the value-proposition, membership-benefit, process-description, hero-pill, badge, vacation-description, and footer-description copy directly from `figma images/Html → Body (2).png` before running the contract test. Keep every visible string case-sensitive and punctuation-sensitive.

- [ ] **Step 3: Add scoped styling that matches the export**

```css
.figma-home {
  --home-ink: #1f1b17;
  --home-copy: #65615b;
  --home-gold: #ddb31d;
  --home-paper: #f2f1ed;
  --home-white: #fffefa;
  --home-line: #dedbd4;
  background: var(--home-white);
  color: var(--home-ink);
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

.figma-home h1,
.figma-home h2,
.figma-home h3 {
  font-family: Georgia, 'Times New Roman', serif;
}

@media (max-width: 760px) {
  .figma-home__nav-links { display: none; }
  .figma-home__hero-grid,
  .figma-home__value-grid,
  .figma-home__membership-grid,
  .figma-home__process-grid { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .figma-home { scroll-behavior: auto; }
  .figma-home * { transition-duration: 0.01ms !important; }
}
```

Add explicit rules for every class rendered by `HomePage`: a centered `1120px` content container, two-column hero, circular hero image, three-column value and process grids, five-tile image collage, two membership cards, full-bleed vacation image overlay, single-column FAQ rows, suggestion strip, two-row footer, `760px` mobile breakpoint, gold focus outlines, and `object-fit: cover` on all photographs.

- [ ] **Step 4: Run TypeScript to catch component and asset-import errors**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit the isolated homepage component and assets**

```powershell
git add -- src/assets/landing src/features/home/pages/home-page.tsx src/features/home/pages/home-page.css
git commit -m "feat: build Figma homepage"
```

### Task 3: Route the Main and Legacy URLs to the New Homepage

**Files:**
- Modify: `src/routes/router.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Import `HomePage` and remove the old routed `LandingPage` import**

```tsx
import { AuthPage } from '@/features/auth/pages/landing-page'
import { HomePage } from '@/features/home/pages/home-page'
```

- [ ] **Step 2: Route both public entry URLs to the new page**

```tsx
function RootRoute() {
  return <HomePage />
}

// inside the route table
{
  path: '/landing-page',
  element: <HomePage />,
},
```

- [ ] **Step 3: Remove the obsolete screenshot landing border overrides**

Delete only `.screenshot-landing`, `.landing-gold-border`, and `.landing-soft-gold-border` rules from `src/index.css`; leave all unrelated global styles untouched.

- [ ] **Step 4: Run the focused Playwright contract**

Run: `npx playwright test tests/e2e/public.spec.ts --grep "Figma homepage|legacy landing"`

Expected: PASS for both `/` and `/landing-page`.

- [ ] **Step 5: Commit routing and cleanup**

```powershell
git add -- src/routes/router.tsx src/index.css
git commit -m "feat: make Figma page the homepage"
```

### Task 4: Visual Fidelity and Responsive Verification

**Files:**
- Modify: `src/features/home/pages/home-page.tsx`
- Modify: `src/features/home/pages/home-page.css`
- Modify: `tests/e2e/public.spec.ts`

- [ ] **Step 1: Start the local Vite server through the repository's Playwright runner**

Run: `npm run test:playwright -- --grep "Figma homepage|legacy landing"`

Expected: PASS and the server exits cleanly after the focused browser checks.

- [ ] **Step 2: Capture desktop and mobile screenshots**

Use Playwright at `1440x900` and `390x844`, saving full-page screenshots under `.artifacts/homepage-desktop.png` and `.artifacts/homepage-mobile.png`.

- [ ] **Step 3: Compare the desktop capture section by section against the Figma export**

Check header height, hero scale, image crops, section ordering, membership-card spacing, vacation overlay, FAQ open state, suggestion strip, and footer. Adjust only the homepage TSX/CSS until the rendered page follows the reference without changing copy.

- [ ] **Step 4: Verify mobile layout and accessibility basics**

Confirm no horizontal scrolling at `390px`, one `h1`, logical heading order, descriptive image alt text, visible focus rings, link targets, a 44px minimum interactive height, and that the FAQ remains keyboard operable.

- [ ] **Step 5: Run final verification**

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS and Vite emits the production bundle.

Run: `npm run test:playwright -- --grep "public acquisition workflow"`

Expected: PASS for the homepage and invitation coverage.

- [ ] **Step 6: Commit any visual QA adjustments**

```powershell
git add -- src/features/home/pages/home-page.tsx src/features/home/pages/home-page.css tests/e2e/public.spec.ts
git commit -m "fix: align homepage with Figma reference"
```
