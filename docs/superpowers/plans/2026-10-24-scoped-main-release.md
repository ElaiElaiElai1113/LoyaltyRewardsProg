# Scoped main release implementation plan

> User explicitly authorized fixing deployment scope, merging the reviewed three-brand work to main and rechecking live sites. This chat is PM/review/release; the existing Medium brand chats implement. No additional design or release approval is pending.

**Goal:** Merge Loyality, RewardMe and Synergize while preserving approved wording/content and every other site's public behavior and domain mapping.

**Architecture:** Keep reviewed UI commits frozen. Replace automatic broad coffee publishing with explicit existing project/domain allowlists and exact-source health gates. Disable competing coffee Git auto-publishing through supported repository configuration. Legacy broad synchronization and credential synchronization require explicit manual opt-in. Preserve current healthy project environments. Synergize remains its own repository/project/backend.

**Stack:** Existing Node/Vercel CLI, GitHub Actions and React/Vite applications; no new dependencies expected.

## Authority and frozen state

- Coffee reviewed UI HEAD: `5bc5869f1dd6e4960415760cb4318286eb45dfcd`; remote main: `f02b69fc2682c1412417dfe365c8154b8c901d1b`.
- Synergize reviewed HEAD: `12fb2251f5ff09f76a20113b5cdb7d5fc783e80f`; remote main: `574a27308faf0550b93c9cf1afe56b351f81549e`.
- Copy authority remains the pre-redesign main versions above. Fresh source audit passed; fresh coffee420 and Synergize604 unit tests passed on24Oct. Prior live23viewport cases and public interactions passed; fresh post-merge acceptance is still required.
- Preserve primary dirty checkout/untracked work and all owner evidence. Reuse existing isolated checkouts. Do not reset, stash, switch or force-push a dirty primary checkout.
- No product/copy/translation, membership/pricing/currency/jurisdiction, database, financial or provider-account change belongs to this release.

## Tasks and gates

1. PM audit: snapshot existing Vercel project Git links, production deployment IDs, related canonical aliases, and exact live text/link baselines. Protect Wondertown, Pinas, Guatemala, Medellin and Innerfire. Other repositories/projects must not be touched. Save sanitized evidence under primary coffee `outputs/main-merge-2026-10-24`.
2. RewardMe implementation owner: small deployment-only fix in workflow/configuration/publisher scripts plus meaningful contract tests. Automatic jobs must deploy exact validated source to the verified RewardMe/Loyality projects with `--skip-domain`, validate source/backend health, then assign only allowed domains. No projectwide promotion or automatic environment/secret overwrite. Disable conflicting coffee Git auto-deployment. Broad tenant/secret synchronization is manual opt-in only. No publish/merge by owner.
3. Synergize owner: read-only audit of main deployment behavior/source stamp and public check contracts. No product/asset/backend edit. Parent addresses any real release hazard through a bounded owner handoff.
4. Independent reviewer: verify actual deployment diff, allowlist/mapping guards, failure-before-write behavior, CI event/source provenance, API asset packaging, Git auto-publishing behavior and unchanged UI/copy. Fix/review through owner until no actionable issue. Serialize heavy local tests/builds.
5. PM integrate scoped commit(s), verify exact new source/unchanged UI tree and current main bases, push review branches, create/attach PRs and inspect CI. Merge both repositories only after review/required checks pass. Use remote PR merge or isolated integration without disturbing dirty roots. Never force-push or bypass protection.
6. Publish only reviewed sites from merged main source, with exact project/team/domain guards. Preserve protected alias mappings/deployment identities. Check new canonical health/source stamps and installed icon hashes. Verify actual copy/ordered links, images/fonts, browser errors, desktop/mobile/tablet/landscape, navigation/locales/calculator/form destinations without real data-writing submissions.
7. Recheck protected sites' before/after mapping and public content/links. Record merged main SHAs, PRs, deployment identities, content proof, checks, rollback IDs and limits. Notify existing implementation chats and report concise outcomes here.

## Allowed public destinations

- RewardMe project `prj_PaxiTVRFRuqys5uKfDXUL3ieSHKF`: `myrewardme.com`, `www.myrewardme.com`, `rewardme-prod.vercel.app`, `reward-me-prog.vercel.app`, `loyalty-rewards-prog.vercel.app`.
- Loyality project `prj_tiFNyQNSAlLpNfX7Mok03DOrclvH`: `loyality-rewards.vercel.app`.
- Synergize project `prj_o3oxXYTyQHakkq1206Zi46WqiIjy`: current Synergize canonical/project aliases only, verified before publication.
- Shared RewardMe project does not authorize moving `wondertown-rewards.vercel.app`. The separate Pinas alias must retain its current target. No broad `ops:deploy:tenants` default call during this release.

## Verification evidence and limitations

Acceptance is based on fresh observed commands and browser renders. Existing receipts are history, not fresh hosted acceptance. Physical-device/native installation and authenticated/financial production writes are excluded. No secret values may be printed or saved in release evidence.
