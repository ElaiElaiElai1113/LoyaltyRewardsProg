# Launch copy and RewardMe logo corrections

> For implementation owners: execute this approved scoped handoff in the existing separate Medium chats. Parent coordinates integration, independent review and publication. Preserve the current redesigned layouts.

**Goal:** Remove the identified launch milestone/streak promotions, use the supplied RewardMe logo consistently, and remove Synergize invitation wording in favour of a clear join/application path showing $500 cash -> $500 credit.

**Authority:** User on 28 October: "Yes lets update those pages as well as the logo ... For synergize ... change the wording and remove all the invitation wording." This approves the scoped design/copy correction already discussed. No further general design approval loop is needed. The broader PDF-versus-Option-B choice remains unresolved; do not adopt Option B wholesale.

**Bases:** Coffee main `5cc80001f87a50071a0e1bbfafe1289745072e8e`; Synergize main `139fefa5ca79caec4b43d3575d622e8eafc46977`. Verify remote main before starting. Use a clean existing isolated checkout and a fresh `codex/` branch from the exact base. Preserve old branches, ignored/untracked evidence and all unrelated work. Never reset/stash/clean the root.

**Architecture:** Existing components, routes and state remain. Change only the authorised visible copy/branding and the tests that enforce those amendments. Existing loyalty/reward calculations, applications for review, account security, private-offer tokens, fees and payments remain functional as before. No commercial activation, automatic acceptance, price/currency change, guarantee, new jurisdiction or unrelated tenant publication.

## 1. RewardMe owner

- Own the `pinas` RewardMe experience only. Preserve Wondertown and all other tenants exactly.
- In `src/features/home/pages/rewardme-reference-home.tsx`, remove the Streak bonuses feature card and the four-week streak preview. Keep the balance, reward examples, ordinary loyalty content, headline, imagery, links and remaining source wording. Adjust only the scoped benefits grid if two cards need two columns.
- Remove only now-unused scoped streak copy/styles. Keep original PDF fixture bytes intact. Amend its preservation test with an explicit dated removal allowlist: `4-week streak`, `Visit once more this week to keep it`, `Streak bonuses`, and `Keep your visit streak alive and unlock bonus points the longer it runs.` Assert their absence in English/Spanish and retain every other source phrase/order plus exact Wondertown snapshots.
- Use the already supplied `/rewardme-client-logo-132.webp` in all affected RewardMe brand positions: `/signin`, `/join`, `/business/apply/commission`, `/business/apply/credit`, along with existing homepage/business headers/footers. A canonical `pinas` override in `BrandLogo`, retaining an explicit caller `imageSrc` and every non-pinas path, may fix the old auth mark. Replace standalone star marks only for pinas. Preserve existing brand text, accessibility, routes, locale controls and proportions.
- Do not redraw/recolour/crop the source artwork, change public assets, alter installation APIs or introduce a new logo. Current 180/192/512 install derivatives already match the supplied client artwork; verify they remain correct.
- Do not replace commission agreements, pricing, consent or form handlers as part of this bounded correction.
- Tests: meaningful old-mark/current-mark regression for each affected route and protected Wondertown path; full applicable unit suite; existing copy/route/tenant guards. Verify desktop/mobile at 320/390/768/1440 and 844x390, English/Spanish, all images/fonts, no overflow/errors, working menus and public form rendering. Do not submit real registrations.

## 2. Loyality owner

- Change only the two identified public `/business` milestone references in `src/features/business/pages/loyality-business-page.tsx`:
  - `Set visit milestones, vouchers, and private offers around the behavior that matters to your business.` -> `Set vouchers and private offers around the behavior that matters to your business.`
  - `Choose visit milestones, vouchers, referral incentives, and any private offers.` -> `Choose vouchers, referral incentives, and any private offers.`
- Add faithful Spanish mappings for these two new phrases if needed. Keep old translations if still used elsewhere. Preserve every other paragraph, layout, demo, route, form, ordinary visit rewards/referrals and private operational feature.
- Do not replace the homepage with Option B, add/remove guarantees or paid tiers, or disable reward logic. Do not edit RewardMe-owned files. Own only the Loyality business component, its focused test and necessary new language mappings.
- Validate actual rendered EN/ES text, absence of milestone promotion on this public page, retained remaining copy/links and five responsive sizes. Keep homepage screenshots/copy and other tenants unchanged.

## 3. Synergize owner

- Inventory all site-owned English and Spanish invitation wording before editing. Replace public marketing, membership/FAQ/agreement, member-access/private-offer and staff-facing labels/messages consistently. Technical routes/IDs, SQL table/field/action names, provider auth calls, stored historical records and logs may remain; list each remaining category explicitly. No renaming of data/transport contracts.
- Preferred minimal replacements:
  - `Invite-only · Business credit network` -> `Business credit network`.
  - `By invitation only.` -> `Membership applications are open.`
  - `Request an invite`, `Request Invitation`, `Request an invitation` -> `Join Synergize` in membership CTAs, targeting existing `/private-membership`. Preserve old deep links/redirects and the `#join` section.
  - Remove the leading invite-only sentence from the membership explanation, retaining the exact $500 cash / $500 credit wording. Repeat the existing offer at the signup entry so the join page makes it clear.
  - Closing title `Request an invite.` -> `Join Synergize.`; description retains `Tell us about your business, and we'll follow up about membership.`
  - Private-offer `Private invitation` -> `Private offer`; invitation-only sharing -> shared directly. Keep tokens/privacy and all package prices/conditions.
  - Account provisioning UI should say account setup/access link; prospect request UI should say application. Existing actions, expiry, security and API contracts remain.
- Agreement section1: remove `invite-only` while retaining the existing private community/trading wording. Section2 title -> `2. Membership Applications and Review`; paragraph -> `Businesses can apply to join. We review applications and can decline an application without giving a reason. This is what keeps the community high-quality and worth being part of.` Retain sections3-11, all fees, credit terms, privacy, signature requirements and existing jurisdiction placeholder exactly.
- Versioning dependency: the application API imports the acknowledgement constant, and the database function has a fixed accepted-version gate. Do not silently change signed/displayed terms under an old identifier or break submission with a new unsupported version. Investigate a minimal new content version `member-agreement-reference-2026-10-28.1` and an additive migration accepting old/current reference versions, preserving existing records, roles, grants, RLS, signature checks, dedupe and all transaction logic. Generate any migration with the Supabase CLI. Do not edit historical migrations. Parent must inspect the actual dedicated project's current function, review the exact migration and test it before any hosted application. Owner makes no hosted changes.
- If versioning requires effects beyond that narrow gate, report the concrete dependency before broadening. Do not work around it by falsifying a source/version field.
- Keep the existing application-review and account-setup workflows. No automatic membership approval, cash collection, credit issue, membership fee/eligibility activation or provider/email-template changes.
- Update EN/ES content and scoped preservation tests with explicit approved replacements; keep unchanged source paragraphs enforced. Verify public pages and private/admin fixtures for residual visible invitation text, all CTA destinations, displayed $500 offer, calculator/deep links, signup validation and controlled submission transport. No real signup/account/email/payment writes.

## 4. Resource and review gates

- Source edits may run independently in the three separate worktrees. Serialize heavy checks and local servers: RewardMe first, then Loyality, then Synergize. A released slot requires stopped owned test processes or a clearly retained one-server handoff. Parent does not start another heavy browser while one runs.
- Record initial state and relevant base gates. Do not change budgets, skip/weaken tests, add packages, alter deployment scopes or publish from owner chats.
- Each owner returns a clean commit, exact base/tip/tree, changed file allowlist, exact visible copy delta, tests, five-size desktop/mobile screenshots and source/behaviour invariants. Stop all own harnesses after receipt.
- Parent cherry-picks the two Coffee candidates into the attached integration worktree, independently reviews both repos, fixes through owners, and runs combined meaningful checks. Preserve the previous full source fixtures and original client files.

## 5. Publication and final verification

- Refresh production identity, source versions and the full paginated alias baseline before release. Protect Wondertown, Pinas, Guatemala and Innerfire deployment pins. Never use broad promote or legacy tenant/environment sync.
- Synergize: any reviewed acknowledgement-gate migration must be applied to its exact dedicated project before the new app version goes live, after confirming current live function/grants match the reviewed prerequisite. No historical record rewrite. Keep rollback source and proof. No real acceptance submissions to test.
- Require independent review, build/lint/unit/appropriate browser and strict existing budget gates. Open/attach scoped PRs. After passing PR checks, merge the reviewed trees to main. Wait for exact main CI and the existing scoped Coffee publishers; use the existing Synergize publication path. Never run concurrent manual/automatic publishers.
- Verify fresh live desktop/mobile pages and EN/ES labels, all corrected logos, versioned installation assets, clear join path/offer, calculator/deep links, route/form rendering and no residual site-owned invitation-only wording. Confirm exact live source matches main, protected aliases unchanged, and no unrelated source/backend/provider effects.
- Final report must distinguish website changes from untested physical phone installation, controlled QA from production writes, and the limited launch amendment from the unresolved wider Option B/commercial draft choices.
