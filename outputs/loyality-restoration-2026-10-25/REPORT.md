# Loyality reference-copy restoration — 2026-10-25

Task 2 is complete locally, ready for parent review/integration. No push, merge to main, deployment, production data writes or product-rule changes were performed.

## Authority and predecessor

- Supplied PDF: C:/Users/Admin/Downloads/Loyality-Website.pdf, SHA256 11e9a8a2a736a4b7310b83c8342ae8dc8d28be509f002a4d7e07fab2e66755bd, verified before edits.
- Actual full raster inspected: primary outputs/reference-copy-review-2026-10-25/Loyality-Website-page1-image1.png. Companion Downloads/loyality-website.html used only for punctuation/transcription cross-check.
- Plan: primary docs/superpowers/plans/2026-10-25-reference-copy-restoration.md, Task 2 only.
- Expected main: 7428dcfc4f50f31a222908be8648eab2f59b4de7. Existing brand branch c20313f safely incorporated main through local merge acb29039a4cf04c076c19f99d9ef467b89fed06f. Unrelated existing outputs were preserved. The candidate is one scoped commit on acb29039; cherry-pick only that final commit for integration.

## Exact copy inventory

Authoritative test inventory: tests/fixtures/loyality-reference-copy.json. All 42 ordered entries match the companion HTML extraction and were reviewed against the PDF raster. Normalization is limited to wrapping/whitespace.

| Region | Entries | Restored content |
| --- | ---: | --- |
| Navigation | 4 | Product; Pricing; Contact; See a Demo |
| Hero | 5 | Your Own Branded Loyalty Program; Your loyalty card, reimagined.; full QR/white-label introduction; both CTAs |
| Example | 6 | Powered by Loyality; Harvest & Vine; neighborhood description; checkout scan explanation; visit reward title and progress explanation |
| Pillars | 11 | Two Core Pillars; full section heading; Acquisition/Trackable referrals; Retention/Visit-based rewards; Simplicity/No POS integration needed; all three full paragraphs |
| White-label benefits | 8 | Why It Works; full heading; For Your Customers/Feels like your program; For Your Business/Runs itself in the background; both complete paragraphs |
| Demo CTA | 3 | See it running for a business like yours.; full no-commitment introduction; Request a Demo |
| Footer | 5 | Exact tagline, Product/Why It Works/Contact labels and full copyright sentence |

The official image logo replaces the reference's text logo; its accessible name remains Loyality. Existing sign-in/business utility access remains. Replacement-only incentives/support/expanded-features/ledger/tier/guarantee/onboarding marketing is removed from this homepage. Supporting routes and disclosures remain unchanged.

## Presentation and functional mappings

- Production changes are limited to loyality-home-page.tsx, its existing CSS and new loyality-home-copy.ts. Forest/lime/paper tokens, Space Grotesk/IBM Plex typography, official logo, both current photos, glyph style and responsive mobile navigation remain.
- The source Harvest & Vine example is presented under the current hero photograph. Its checkerboard and progress bar are decorative examples, preserving the reference text; no functional QR, billing, points or visit feature is introduced.
- All See a Demo and Request a Demo links use the working existing /business route. Footer Contact uses /business instead of an inert reference placeholder. Sign in remains /signin; the existing sign-in/join journey is preserved.
- Reference anchors #how, #pricing, #demo and #contact work. Prior #concept/#pillars map to pillars; #support/#features/#guarantee to white-label benefits; #ledger/#example to the sample card. The aliases retain zero height/padding so old ID styles cannot create blank sections. No inert href="#" remains.
- Current-section behavior now handles the bottom-of-page Contact state. Escape, outside pointer, link close and desktop resize behavior are retained.
- PM explicitly clarified meaningful Spanish functionality during implementation. New dictionary entries are faithful functional translations of the same English source phrases, scoped only to Loyality's homepage; they are not represented as separately client-approved Spanish wording. Shared translation catalogs and other brands are unchanged. Strict Spanish heading/English-absence expectations remain in locale tests.

## Verification

- Source-derived copy checker: RED against predecessor, GREEN after restoration; 42 English entries, scoped Spanish mapping coverage and no placeholder links. copy-red.log/copy-green.log retained.
- Ordered companion-HTML comparison: all 42 blocks exactly equal the independent inventory; reference-comparison.json/log retained.
- Focused product unit tests: 8/8 passed.
- Initial public/local behavior run: 24/24 passed, including unchanged referral, safe redirect, visit validation, voucher retry, concurrent tab and tenant/account isolation regressions. Local deterministic mocks only.
- Final public/tenant/responsive/locale run after Spanish restoration: 25/25 passed, one worker.
- Review corrections: 3/3 affected browser cases passed after fixing Contact activation and photo selector specificity. Permanent assertions cover Contact current at bottom, alias zero padding/height and 320px restored photo height on phone/tablet.
- Final five-size audit: 320x780, 390x844, 768x1024, 1440x900 and 844x390. English reference body/footer and responsive nav copy visible; Spanish body/footer translated at every size; English/Spanish source headings exact; no horizontal overflow; Space Grotesk 500 loaded; all four homepage images (two photos/two logos) complete and decoded; visible links/buttons/language control meet 44x44px; all five footer links pass three actual hit points without dock overlap. All old/reference IDs resolve; menus, current section, public routes and reduced motion pass. No HTTP >=400 or page errors.
- Ten sampled body/example/benefit/footer text pairs meet 4.5:1; minimum 5.36:1. This is scoped contrast coverage, not a full accessibility audit.
- Lint for all changed TypeScript files and git diff --check passed.
- One final production build passed (TypeScript/Vite/PWA). Existing inlineDynamicImports deprecation warning remains. Built JavaScript explicitly contains the bottom-of-page Contact condition; built CSS contains the corrected scoped image selectors.
- Build budget passed: 12,577,951 / 12,582,912 bytes, 4,961 bytes headroom; no violations, precached media or credential exposures. Parent must measure the combined candidate independently.
- Read-only reviewer found two bounded issues, both corrected and re-reviewed with no remaining actionable findings. No tests were skipped, deleted or given weaker functional/accessibility thresholds to secure a pass.

## Evidence and limits

Tracked evidence includes full final screenshots at all five widths, Spanish screenshots at 390/1440, selected hero/benefit/footer details, visual-acceptance.json, audit/server scripts and check/build logs. Additional captures and scratch edit helpers remain local and excluded from commit.

Actual final images were visually inspected at desktop, phone, 320px, tablet and landscape footer. During verification, a hidden-menu getByRole lookup in the custom audit was corrected to inspect the hidden link's attribute directly; source code did not change for that harness correction. Alias spacing inherited from removed sections was found visually and neutralized before final captures.

This is local browser emulation and build evidence. No hosted acceptance, physical-device acceptance, backend feature activation, real signup, mail or payment submission is claimed. Parent owns independent review, combined integration, CI and scoped publication. Port 5191 uses a local-only empty-backend harness with the exact resolved node_modules junction allowed; no repository Vite config or production environment setting was changed.