# Reference Copy Restoration Implementation Plan

> **For agentic workers:** Execute the brand-specific task in its existing implementation chat. The human explicitly selected those three chats; this PM chat coordinates review and integration. Do not create replacement chats or request another design approval.

**Goal:** Restore all public homepage wording and content from the three files explicitly selected by the human on October 25, keeping the current visual designs, supplied logos, responsive quality and existing functionality.

**Architecture:** Replace the brand's marketing content in its current React components and restore missing reference sections using the current brand styles. Preserve existing route/handler contracts, application behavior, APIs, schemas, authentication, payment availability and calculator formulas. Do not roll the repositories back to old commits or copy obsolete HTML scripts/styles into the application.

**Tech Stack:** React, TypeScript, existing brand CSS, Vitest and Playwright. Existing independent managed worktrees and implementation chats.

## Authority and acceptance

The latest user instruction explicitly makes these files the restoration targets:

- RewardMe: `C:/Users/Admin/Downloads/RewardMe-Website.pdf`.
- Loyality: `C:/Users/Admin/Downloads/Loyality-Website.pdf`.
- Synergize: `C:/Users/Admin/Downloads/synergize.html`.

Both PDFs are single raster pages with no text layer. Read their actual images, available at `C:/Users/Admin/Desktop/Projects/Portfolio/coffee-loyalty/outputs/reference-copy-review-2026-10-25/RewardMe-Website-page1-image1.png` and `Loyality-Website-page1-image1.png`. Local `rewardme-website.html` and `loyality-website.html` in Downloads match the PDF copy visually and may assist transcription; the supplied PDFs remain authoritative. Normalize line wrapping/whitespace only. Do not paraphrase, invent commercial claims or silently substitute the previous website baseline.

Preserve current supplied logos and install assets. Retain working language controls and accessibility semantics. Existing navigation labels and CTA copy can follow the reference, but their destinations must use functioning current routes/anchors, never inert `#` placeholders. Reconcile old anchors with aliases/real destinations; do not break existing deep links. Existing operational/supporting pages stay unchanged unless a minimal shared-header adjustment is required and documented.

The current designs are already approved. Missing content may require more cards or sections, styled with the current palette, type, imagery, spacing, buttons and mobile navigation. Do not restore the old visual design. No new functional membership, billing, reward, streak, guarantee, credit-line or payment features are authorized by restoring their marketing descriptions.

## Task 1: RewardMe chat

Owner: existing RewardMe implementation chat `01a15f5d-bae7-7a30-af1a-618d652c7215`, retaining Medium reasoning. Start from current main after safe worktree preflight; expected merged predecessor `7428dcfc4f50f31a222908be8648eab2f59b4de7`. Reuse `C:/Users/Admin/.codex/worktrees/rewardme-final-design/coffee-loyalty` only after preserving unrelated work and safely incorporating main. Use port 5192.

Primary scope: `src/features/home/pages/rewardme-home.tsx`, `.css`, `src/features/home/components/rewardme-public-header.tsx`, and directly relevant tests. If isolation is clearer, extract a brand-scoped restored home component and scope its CSS under the existing RewardMe root. Do not edit Loyality files or globally re-theme shared screens. Keep Wondertown's existing homepage/identity/disclosures/behavior unchanged: use an explicit tenant boundary if the shared component would otherwise receive the restored RewardMe copy. Do not change tenant host mapping or deploy pins.

- [ ] Inspect PDF, transcribe all visible nav/hero/account example/steps/features/CTA/footer copy and verify against the raster.
- [ ] Restore `Get rewarded for spending where you already love.` and the original body, points/streak/reward examples, three steps, three retention benefits and closing CTA.
- [ ] Remove replacement-only marketing sections from this homepage where they have no reference counterpart; retain their functioning routes elsewhere.
- [ ] Keep the current forest/cream/gold visual treatment, supplied logo, imagery, mobile menu and working join/business/catalog/auth destinations.
- [ ] Add a source-derived copy-preservation check; include a heading assertion for the exact restored tagline and a Wondertown baseline comparison. Do not add tests that merely mirror markup.
- [ ] Verify rendering, all reference copy and navigation on desktop/mobile; run relevant existing tests and build once.
- [ ] Commit only scoped changes locally and return candidate SHA, changed files, copy inventory, screenshots, checks and limits. Do not push, merge or deploy.

## Task 2: Loyality chat

Owner: existing Loyality implementation chat `01a15f5d-b4d4-7821-acca-86c672e2b3e3`, retaining Medium reasoning. Expected predecessor main `7428dcfc4f50f31a222908be8648eab2f59b4de7`. Reuse `C:/Users/Admin/.codex/worktrees/loyality-approved-design/coffee-loyalty` safely; port 5191.

Primary scope: `src/features/loyality/pages/loyality-home-page.tsx`, `.css`, brand-scoped footer/header if required, and relevant tests. No RewardMe or global CSS edits.

- [ ] Inspect/transcribe the PDF's full copy and examples.
- [ ] Restore `Your loyalty card, reimagined.`, QR/white-label introduction, Harvest & Vine example, referral/visit/POS pillars, white-label benefits and demo CTA/footer wording.
- [ ] Remove replacement-only homepage membership-tier/guarantee/expanded feature marketing where the PDF has no counterpart. Do not change underlying product capabilities or supporting-route disclosures.
- [ ] Keep current lime/forest visual styling, supplied logo, current imagery and mobile behavior. Demo-labelled actions must retain real existing destinations or existing onboarding/contact handlers.
- [ ] Verify exact source copy, old deep-link compatibility, language switching, menus and relevant public journeys. Add a source-derived copy check and exact tagline assertion.
- [ ] Run the brand's responsive verification and relevant existing tests/build. Return a scoped local commit and complete evidence; do not push, merge or deploy.

## Task 3: Synergize chat

Owner: existing Synergize implementation chat `01a15f5d-c27a-7f51-aca1-a2b715e1f04c`, retaining Medium reasoning. Expected predecessor main `ce990dfef0e30e8c2307a9422367a9970d984b13`. Reuse `C:/Users/Admin/.codex/worktrees/synergize-approved-final/SynergizeBusinessGroup` safely; port 5193.

Primary scope: `src/pages/HomePage.tsx`, `src/final-home.css`, minimal homepage-aware `src/components/Layout.tsx` changes, and relevant tests. Reuse existing `src/components/CostCalculator.tsx` without changing calculations or state contracts if needed. Preserve industries, member/admin/auth routes and existing `/#calculator` redirect behavior.

- [ ] Parse the supplied HTML inertly and inventory all visible copy, ledger records, statistics, benefits, hard-cost examples, calculator labels/results, membership and footer content.
- [ ] Restore `Turn what you don't need into what you do.` and all missing reference sections, including the $500 cash-to-$500-credit membership explanation. Do not introduce COP/geolocation/jurisdiction changes.
- [ ] Keep the current forest/cream/burgundy style, official logo, both current photos, responsive cards and accessible mobile menu.
- [ ] Reuse current calculator logic and real application links. Restore the calculator section's source copy and interactive content on the homepage using the existing calculator component/logic. Give the in-page instance a non-conflicting ID if necessary, while keeping the existing `/#calculator` redirect and canonical `/how-it-works#calculator` behavior intact. Do not duplicate or change formulas.
- [ ] Verify the full reference narrative is restored on the homepage, including calculator and membership content. Do not declare an omitted section restored merely because a supporting route contains related text.
- [ ] Run source-derived copy checks, industry/calculator/nav regressions and desktop/mobile checks. Return scoped local commit/evidence; do not push, merge or deploy.

## Resource and review coordination

All three chats may inspect/edit independently. Heavy local unit/build/browser work is serialized through PM messages to avoid Windows resource exhaustion. Each owner may start the source inventory and edits immediately; request a test slot when ready. Use one browser worker; keep separate exact ports. Do not weaken checks or remove tests to obtain a pass.

- [ ] PM receives all scoped candidate commits and independently reviews diffs and copy against the actual supplied files.
- [ ] PM integrates the two non-overlapping coffee changes in the attached integration worktree, preserving unrelated root work.
- [ ] Check exact English copy and functional language controls; do not invent client-approved Spanish prose. Any missing source-language mappings must be reported and handled without breaking existing locale behavior.
- [ ] Check 1440 and 390 for all three sites, plus 320, 768 and 844x390 overflow/menu/footer/image checks. Exercise real route/anchor destinations, auth/join page rendering, Synergize industries/calculator and Wondertown unaffected behavior. No real submissions, mail, payments or production data writes.
- [ ] Review/fix/review any discrepancies through the owning implementation chat. Keep other sites unchanged.
- [ ] After independent review and successful checks, PM owns integration, main/CI verification and scoped publication to the same three already-authorized sites, followed by live desktop/mobile copy and behavior checks. Preserve every other site's deployment pins. Implementation chats must not deploy independently.
