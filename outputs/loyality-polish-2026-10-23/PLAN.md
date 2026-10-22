# Loyality measured body polish plan

PM brief: 2026-10-23-three-brand-visual-polish.md, docs commit 5fd5185bf6b42f80be4e6bbc7b5c61e18f9fb2ff.

Base: e098e43136fd2abbc2f1bae44dff498ab0f9a2c9. Source allowlist: homepage CSS only; no TSX change expected. No new assets/dependencies/content. Preserve hero geometry and existing photographs. No broad tests/build before PM slot.

1. Capture exact predecessor local English/Spanish text nodes, ordered link/accessibility label tuples, hero/card/section geometry and asset/font states with one browser. Preserve the existing live preflight.
2. Correct measured card rhythm: group existing glyph/label/title; normalize incentive spacing/border; apply the readable pillar row treatment through tablet width; replace support floats with a deliberate icon/text grid. No content or handlers change.
3. Restrained interaction styling only for real links/buttons. Remove the decorative incentive-card hover lift. Keep focus/menu/current-section behavior and reduced-motion handling.
4. With one browser, inspect 320/390/768/1440 and affected landscape; wait for fonts and decoded images. Compare exact ordered English/Spanish DOM/link/ARIA snapshots. Measure footer/dock actual hit tests and contrast. Do not move the dock if no collision is measured.
5. Report readiness for the PM build slot. When granted, run only serialized relevant build/type/lint/budget checks, obtain read-only review and commit scoped source plus evidence. Parent reviews/integrates/deploys.

Preflight correction: initial tablet three-column hypothesis was disproved by detailed captures/source. At768 the incentive cards already stack; standalone icon/label bands create excess height. Pillars also stack but retain desktop vertical dividers/limited title measure. Target these actual problems; preserve the hero.
