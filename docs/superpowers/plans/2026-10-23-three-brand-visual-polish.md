# Three-brand UI/UX polish implementation plan

> For implementation workers: use the existing per-brand Medium chats and isolated worktrees. This parent chat owns product direction, review and release coordination. The user explicitly authorized autonomous execution while asleep; the original content and wording are frozen. No additional design approval is pending.

**Goal:** Restore RewardMe's original forest/cream/gold identity and refine the approved desktop/mobile presentation across Loyality, RewardMe and Synergize without changing approved prose or application behavior.

**Architecture:** Brand-scoped CSS and necessary presentational wrappers only. Existing components, routes, tenant contracts, data and assets remain authoritative. Keep the current improved compositions; make hierarchy, image framing, card rhythm and interaction affordances clearer. Do not copy third-party content, claims, assets or branding.

**Stack:** Existing React/TypeScript/Vite applications, current locally installed fonts/images and responsive CSS. No new dependency or heavy asset is expected.

## Authority and operating model

- The latest user message approves original RewardMe green/cream/gold, explains Shaun meant the redesign's new colors, assigns this chat the PM role and other chats implementation, and asks autonomous UI/UX work plus external inspiration research while asleep.
- This supersedes the previous black/gold interpretation for RewardMe only. It does not undo the current supplied-logo/home-screen-icon repair.
- Existing per-brand implementation chats retain Medium reasoning. The parent remains the Extra High PM/reviewer, coordinates one build slot at a time and is the sole release publisher. Reuse existing active worktrees and preserve dirty roots.
- Wording authority: coffee baseline `f02b69fc2682c1412417dfe365c8154b8c901d1b`; Synergize baseline `574a27308faf0550b93c9cf1afe56b351f81549e`. This was explicitly confirmed by the user. Current pre-polish live DOM captures are frozen under the primary coffee root `outputs/pm-design-2026-10-23`.
- Synergize membership visibility, COP2,000,000 pricing, location/currency logic and agreement jurisdiction are separate policy/content work and remain excluded. No financial/legal terms may be invented in a visual pass.

## Research and selected design principles

Official pages were opened and rendered at desktop/mobile sizes. Screenshots and a source receipt are under the primary coffee root `outputs/pm-design-2026-10-23/inspiration`.

| Reference | Observed strength | Apply to these sites |
| --- | --- | --- |
| [Smile](https://smile.io/) | Clear title/action grouping, photographic cards, and a compact mobile reading sequence | Preserve our existing photos and text; improve framing, spacing and the scan between sections. Do not add their logos, statistics or testimonials. |
| [LoyaltyLion](https://loyaltylion.com/) | A visible product illustration supports the main proposition | Keep our approved sample account/ledger as a strong visual anchor, with readable labels and clear depth. No invented live data or metrics. |
| [Square Loyalty](https://squareup.com/us/en/software/loyalty) | Human business photography and obvious primary/secondary action hierarchy | Maintain existing imagery and CTA destinations; refine relative prominence, focus and hover treatment. |
| [Wise Business](https://wise.com/gb/business/) | Cohesive green identity, strong light/dark contrast and explicit mobile action hierarchy | RewardMe returns to its own original forest/cream/brass palette. Maintain comfortable mobile typography and distinct primary/secondary actions; do not copy Wise's type, colors or claims. |

The goal is purposeful interest, not more decoration. No extra marketing sections, fake testimonials, counters, unsupported guarantees, auto-playing carousels, gratuitous gradients or perpetual animation. Existing static sample records stay static. Interactive hover treatment applies to actual interactive elements, not decorative ledger cards. Any motion respects reduced motion.

## Task 1: RewardMe implementation

Owner checkout: `C:/Users/Admin/.codex/worktrees/rewardme-final-design/coffee-loyalty`, start `b54d7652949e20f7ad53896a2bf1532d1bcee550`. Current live combined source is `557bbe763d2d4a98906e827ba3f8b4911777b57f`.

- Replace the recent pinas black/gold overrides with the original identity: forest `#1F3A2E`, paper `#F6F1E4`, brass `#B8862E`; choose darker/lighter gold values when necessary for text contrast.
- Main surfaces return to warm cream with forest text. Existing deep storytelling/account panels can remain forest with cream text, providing rhythm. Gold is an accent and action color. Remove the redesign's rust/orange accents from pinas. Keep photos and the improved split hero/mobile order.
- Keep the current supplied green/white/gold master unchanged in loading/header/public footers and current versioned180/192/512 PNG delivery. Restore pinas theme/background metadata to green/cream consistently in install manifest, document brand and bootstrap. Keep cache identity, exact aliases, GET/HEAD behavior and host/query guards.
- Preserve Wondertown exactly through explicit pinas scoping. Private/custom-logo behavior remains unchanged.
- Inspect hero/body measure, ledger legibility, card surfaces, business/footer continuity, button hover/focus and language-control overlap. Preserve every existing content item and destination.
- Expected files: RewardMe homepage CSS; pinas fields in install/document/bootstrap branding; tests only when a real contract or previously asserted presentation changes. Do not edit shared global styling or other tenant content.

## Task 2: Loyality implementation

Owner checkout: `C:/Users/Admin/.codex/worktrees/loyality-approved-design/coffee-loyalty`, start `e098e43136fd2abbc2f1bae44dff498ab0f9a2c9`. Current live source is `300edc4e1b0c7d5c3c5f908f4678b12a9772f06e`.

- Keep the supplied logo, established palette, hero photograph, current main composition and exact wording.
- Use a measured final polish: section-heading hierarchy, consistent card padding/borders, restrained depth, photograph/caption readability and balanced transitions between dense text groups. The main hero already has strong hierarchy; do not replace it just to produce a larger diff.
- Mobile cards must form a deliberate reading sequence, with comfortable gutters and action targets. Verify photo captions and CTA hierarchy at320/390 and table/tablet sizes.
- Improve interactive states on existing links/buttons, preserve current-section indications and menu/focus behavior. Check footer links against the fixed language picker at maximum scroll using hit testing; reserve safe space when needed.
- Preferred source scope: `src/features/loyality/pages/loyality-home-page.css`; presentational wrappers only in the adjacent TSX if necessary. No global/shared styles, copy, data or other brand changes.

## Task 3: Synergize implementation

Owner checkout: `C:/Users/Admin/.codex/worktrees/synergize-approved-final/SynergizeBusinessGroup`, start/current live `4101b2a0e8d8f17aa71619d6244fc44dea8e32d8`.

- Keep the current forest/warm-neutral/claret identity, supplied logo and two approved photos. Keep the editorial heading treatment and network-ledger concept.
- Prioritize ledger/detail legibility on desktop and mobile, balanced card geometry, clear existing glyph/connector depth, photo framing and a consistent radius/border/elevation system. Ensure small mono labels remain readable without replacing their words.
- Give existing linked industry cards and CTAs clear, restrained hover/focus/active affordances. Preserve the static nature of decorative sample ledger records.
- Review visual continuity on current public pages, tablet navigation, footer/CTA spacing and language control. Keep all calculator, hash routing, language, auth and form contracts intact.
- Preferred files: `src/final-home.css`; presentation wrappers only in `src/pages/HomePage.tsx`. Layout styling can change only for a measured responsive/focus issue, with the same links and text. No new photos, sections or commercial/policy revisions.

## Task 4: Verification and handoff from each owner

- Capture exact predecessor DOM/source before edits, then compare all nonempty text nodes and ordered link label/destination pairs in English and Spanish where currently supported. No visible or accessible wording may be silently added/removed/rewritten. Decorative wrappers do not authorize copy changes.
- Inspect320,390,768 and1440 widths, and a landscape width if the changed area is affected. Wait for fonts and lazy image decode before judging. Check horizontal overflow, clipping, 44px interaction targets, keyboard focus, mobile-menu lifecycle, actual image/font responses and reduced motion.
- Measure text contrast on actual backgrounds and check interactive hit targets against fixed controls at page bottom. Do not activate mailto, submit real forms, register accounts or make hosted writes.
- No new tests for purely cosmetic reversible changes. Use focused regression coverage for any meaningful behavior affected; update obsolete visual assertions without weakening independent product contracts.
- Build/test work is serialized by the PM. Report readiness for the one build slot before running a broad suite. Coffee uses single-worker unit checks. Keep the unchanged client12MiB budget; final pre-polish combined headroom is367bytes. Replacing the bulky black/gold block should reclaim room. No unrelated asset cleanup or budget relaxation.
- Return a scoped local commit, exact base/candidate SHAs, changed files, screenshots, copy/links proof, relevant checks and limitations. No deploy, push, merge, environment/DB changes, fixtures or external messages from owner chats.

## Task 5: PM review, integration and release

- Read each actual diff, independent review findings and rendered desktop/mobile captures. Send bounded corrections to the owning chat. Stop visual iteration once acceptance is met.
- Integrate only reviewed brand commits in the existing combined release checkout; retain root work and separate brand history. Synergize stays in its own repository/worktree. No broad tenant deployment command or main push.
- Publish only reviewed changes to the existing correct Vercel projects after source, health and asset checks. Revalidate current production/rollback identities before promotion; do not overwrite a changed external deployment blindly.
- Fresh live desktop/mobile checks must confirm exact frozen text/links, correct fonts/assets, navigation, tenant guards and logo/icon delivery. Check Wondertown regressions whenever shared coffee code ships. Keep physical-device/private financial acceptance distinct from public browser viewport QA.
- Save a concise final PM receipt stating what changed, content preservation, URLs/source versions, check outcomes, limits and any deferred content/policy work. Keep this PM chat for decisions and the three existing chats for implementation.
