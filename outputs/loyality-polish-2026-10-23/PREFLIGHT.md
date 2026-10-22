# Loyality visual preflight — 2026-10-23

Read-only inspection of current live Loyality at 320/390/768/1440. Local worktree remains on `e098e43136fd2abbc2f1bae44dff498ab0f9a2c9`; only new preflight evidence files were written. No build, broad tests, dependency installation, source edits, deployment, direct database/provider calls or fixture writes. No AGENTS.md found in this checkout. Existing untracked live-preflight evidence remains untouched.

## Proposed priorities for PM brief

1. **Tablet card density:** at 768px the three-column incentives and pillars leave each text column too narrow. Concept is ~1,366px tall; pillars ~1,319px. Change their tablet presentation to wider rows or a deliberate two-column/featured arrangement, retaining every word. Desktop three-column hierarchy can remain.
2. **Phone hero pacing:** at 320px the photo begins around y=744, after stacked CTA buttons; at 390px around y=622. Retain headline/body sizes and make tighter but readable spacing and CTA wrapping decisions so the scene arrives earlier. The 768px hero also starts the photo at ~y=646 despite ample horizontal room; evaluate a deliberate tablet composition.
3. **Section rhythm:** the page is ~8,512px desktop, 11,743px tablet, 13,724px at 390 and 15,348px at 320. Not all length is removable because all copy must remain. Replace repeated tall padding/card stacks with clearer transitions between incentives, support/pillars, process/activity and terms; stronger grouped surfaces and connector rhythm can make the same content easier to scan.
4. **Phone cards and process:** icons/labels/headings occupy separate bands repeatedly. Consolidate decorative icon/eyebrow placement and rationalize inner spacing instead of shrinking body copy or adding accordions/behavior. Maintain 44px controls and visible keyboard focus.
5. **CTA ending:** the final centered CTA currently repeats the page's plain paper sections. An intentional pale-lime/forest closing composition can make it feel finished and link into the footer without adding copy, badges, commercial claims or destinations.
6. **Language dock/crops:** no dock/footer link intersections at any inspected width. Preserve that bottom safety space. On 320px the fixed dock overlaps the product photo/decorative badge as it enters view; on other phones it can cover the image. Any improvement should stay homepage scoped and retain the control's accessibility and availability. Existing QR/owner photos are usable; frame face/phone/QR details purposefully rather than replacing assets.

## Current strengths to retain

- Official blue/teal logo preserved on its white background; forest/lime/near-white palette clearly distinguishes the brand.
- Clear main heading, usable CTA labels, legible body copy and authentic product-context photography.
- Sticky navigation and live keyboard behavior work: menu opens, focused link has visible 3px outline, Escape closes and returns focus to toggle.
- Footer links remain outside the fixed language dock at 320/390/768/1440; no overflow observed.

## Evidence

`preflight.json` contains dimensions/section heights/footer intersection results. `keyboard-preflight.json` records menu/focus outcomes. `preflight-hero-*`, `preflight-footer-*`, full-page captures and tablet concept/pillar detail captures preserve the current state. No implementation started; await PM brief and explicit shared-PC build slot before a build.

## Detail inspection correction

Subsequent inspection of the tablet detail captures and the exact cascade confirms the card grids already become one column at761–960px. The excess height is caused by standalone icon/label bands and retained desktop pillar dividers/title widths, not a live three-column grid. The implementation plan targets this measured behavior and keeps the hero unchanged, per the PM brief.
