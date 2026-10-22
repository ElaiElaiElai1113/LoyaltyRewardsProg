# Loyality body polish receipt — 2026-10-23

Ready for parent review and integration. Source base: e098e43136fd2abbc2f1bae44dff498ab0f9a2c9. Approved brief: docs commit 5fd5185bf6b42f80be4e6bbc7b5c61e18f9fb2ff, 2026-10-23-three-brand-visual-polish.md. Final candidate SHA is recorded in the handoff and local candidate-receipt.json after commit.

## Scope and result

Only src/features/loyality/pages/loyality-home-page.css changes application source. Existing incentive/support glyphs, labels and headings use a consistent grid with full-width body copy. Incentive padding is tightened; tablet pillars reuse the existing mobile row treatment through 960px. Decorative card hover lift is removed. Real footer links gain underline hover and lime keyboard focus; short header/footer links have 44px minimum width.

Hero composition, supplied logo, palette, photographs, content, translations, routes and handlers are preserved. No TSX, shared CSS, other brands, dependencies, assets, provider/settings or database changes. No authenticated or real form submissions. Parent owns combined acceptance, integration and deployment.

## Evidence and verification

- Exact predecessor before.json versus after.json: ordered English/Spanish text nodes, link destinations/labels and accessible labels match exactly. capture-local.mjs enforces equality.
- Hero bounding geometry matches the exact predecessor at 320, 390, 768, 1440 and 844px widths.
- At 768px, concept height changes from 1366px to 1071px; pillars from 1319px to 879px. Overall page height changes from 11743px to 10980px. Mobile 390px changes from 13724px to 13287px. See JSON for unrounded measures.
- Focused Playwright audit passes at 320x780, 390x844, 768x1024, 1440x900 and 844x390: no horizontal overflow; Space Grotesk 500 loaded; all homepage images loaded and decoded; checked visible navigation/menu/CTA/footer/language targets meet 44x44px; all six footer links pass three actual hit-test points with no language-dock intersection at every size.
- Mobile menu: Escape returns focus, outside pointer closes, desktop resize resets state, section link closes and marks current section. Decorative cards retain transform:none. Reduced-motion transitions are disabled.
- Keyboard modality checked explicitly: footer focus is solid 3px #d4f28a. Screenshot final-footer-focus-390.png visually inspected.
- Seven sampled body/label/caption/footer text pairs meet 4.5:1; minimum measured 5.36:1. This is a scoped sample, not a complete accessibility audit.
- No browser page errors or HTTP >=400 responses in the focused audit. Test backend resolution is intercepted locally; no production credential/config changes.
- npm run build: exit 0, including TypeScript/Vite/PWA. Existing inlineDynamicImports deprecation warning remains. npm run build:budget: exit 0, total 12,547,313 / 12,582,912 bytes, no violations, precached media or credential exposures.
- Exact standalone budget delta: 12,547,313 - 12,546,648 = +665 bytes; remaining standalone headroom 35,599 bytes. Parent must measure the combined build; standalone headroom is not combined acceptance.
- git diff --check passes. No full unit suite rerun for this CSS-only change.
- Independent read-only reviewer /root/review_loyality: no actionable findings after CSS and capture review. PM approved the inspected direction before final build.

## Review artifacts

Tracked: before/after JSON, focused audit JSON/script, build/budget logs, preflight/plan, and selected before/after tablet concept/pillars, desktop support and keyboard-focus screenshots. Full five-width final captures and additional details remain available locally in this directory, excluded from commit to avoid unnecessary evidence bulk.

## Audit harness corrections and limits

The first custom audit attempt had a script bracket syntax error. The footer check was then strengthened to activate keyboard modality and assert outline style/color rather than width alone; an incorrectly transcribed expected lime channel was corrected against the existing CSS token. Final audit passes; these were evidence-script corrections and required no application changes or repeated production builds. Detailed preflight also disproved the initial three-column tablet hypothesis; the actual stacked-card spacing/divider problem is recorded in PREFLIGHT.md.

Browser emulation does not establish physical-device or hosted acceptance. Existing dock overlay elsewhere in the page and public/private flow boundaries remain unchanged. Previously recorded release checks are historical context, not new deployment evidence.