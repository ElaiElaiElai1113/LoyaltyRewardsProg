# Tenant deployment automation

## Automatic RewardMe release

The `Tenant deployment synchronization` workflow automatically publishes only the existing `loyalty-rewards-prog` RewardMe project after successful same-repository push CI on `main`. It checks out the exact validated full commit SHA and calls `scripts/publish-reviewed-site.mjs`. The publisher verifies a clean checkout without untracked source, fixed project/team IDs, current alias ownership and complete paginated alias inventory. It stages with `vercel deploy --prod --skip-domain` and deployment-only `REWARDS_SOURCE_COMMIT`/`githubCommitSha` stamps. Before assigning any alias it requires a READY candidate with the exact source, healthy database and the existing backend project reference.

Only `myrewardme.com`, `www.myrewardme.com`, `loyalty-rewards-prog.vercel.app`, `rewardme-prod.vercel.app` and `reward-me-prog.vercel.app` receive explicit RewardMe alias assignments and automatic exact-version checks. No projectwide promotion is used. The existing Wondertown and separate Pinas mappings are protected even though they belong to the RewardMe project and currently point at different deployments. Every pre-existing non-allowlisted alias mapping is compared before/after staging, before each assignment and after publication. Drift stops the run; there is no automatic broad rollback. Alias assignments are sequential, not atomic: failed runs retain the candidate, baseline and completed assignments in the artifact for bounded recovery.

Pinned CLI58.7.1 staging was observed to move the target's internal generated team alias even with `--skip-domain`. The only declared platform-managed staging aliases are `loyalty-rewards-prog-elaielaielai1113s-projects.vercel.app` for RewardMe and `loyality-rewards-elaielaielai1113s-projects.vercel.app` for Loyality. The current target's exact internal alias must belong to the verified project before staging and must point to the verified candidate afterward, before every assignment and at completion. There is no pattern exemption: every other alias, including the other project's internal alias and all user-facing aliases, remains protected by the original comparison rules.

The audited Wondertown and Pinas project/deployment IDs are fixed pins in the publisher, checked before staging and on every inventory read. Missing or changed protected pins require a new reviewed disposition; a runtime snapshot cannot adopt that drift as a new baseline. Already assigned allowed aliases must continue to point at the new candidate on every later comparison and at completion.

Candidate health uses authenticated `vercel curl` from a local link containing only the verified org/project IDs. The publisher requires an existing automation-bypass token from read-only project metadata and passes it only through the health child's `VERCEL_AUTOMATION_BYPASS_SECRET` environment. Absence stops publication; CLI token creation is never allowed. CI authentication comes from `VERCEL_TOKEN`; no credential is printed or written to the link/evidence. Do not add `--scope`, `--token` or `--cwd` to this curl command: the pinned CLI forwards unknown flags to OS curl. HTTP errors, redirects, non-JSON responses and wrong source/backend values stop publication. Diagnose deployment protection with a protected read, not by changing platform protection settings.

The publisher rechecks `origin/main` via read-only `git ls-remote` before staging and before every alias assignment. A queued or manual run whose source is no longer the latest main stops rather than publishing stale source.

The separate `Deploy Loyality production` workflow uses the same successful same-repository main-push CI provenance gate and exact triggering SHA, its existing fixed `loyality-rewards` project and only `loyality-rewards.vercel.app`. It preserves current credentials; persistent environment refresh is available only through manual `refresh_server_environment=true` (default false). Both workflows run focused publication contracts before external operations, including manual dispatches, and share a non-cancelling publication concurrency group. The immutable candidate is health-checked before any public alias moves.

The `Post-deployment verification` workflow remains manual-only and still includes its legacy multi-domain checks. It must not be treated as a RewardMe-only release check. `vercel.json` sets `git.deploymentEnabled=false` to prevent Git-driven projectwide domain reassignment. Explicit CLI publication remains available. External deploy hooks and other repository configurations remain separate entry points; audit them independently before merging.

Vercel documents [disabling Git deployments](https://vercel.com/docs/project-configuration/git-configuration) and [staging production with skip-domain](https://vercel.com/docs/cli/deploy#skip-domain). The initial controlled stage must still verify the entire alias inventory, including generated team aliases, before enabling automatic publication; static flags and a candidate's alias list alone do not prove platform behavior.

## Required GitHub settings

1. Create a repository Actions secret named `VERCEL_TOKEN` using a scoped Vercel automation token.
2. The bounded publisher pins team `team_iq0fxUZhStWlQQjamjS1ONwR` and scope `elaielaielai1113s-projects`; it does not accept arbitrary target overrides.

Only the retained legacy synchronizer supports `VERCEL_PRIMARY_PROJECT` and `VERCEL_GUATEMALA_PROJECT` overrides.

## Legacy manual opt-in

A manual workflow run defaults to RewardMe-only. The boolean `legacy_tenant_sync` input defaults to `false`. Enable it only for an explicitly authorized legacy synchronization: it refreshes the RewardMe server secret from the configured GitHub secret, deploys Guatemala, retargets `rewardme-prod.vercel.app`, the independent `pinas-rewards.vercel.app` and `wondertown-rewards.vercel.app`, and verifies the legacy canonical domains. This broader action is not part of an ordinary RewardMe release.

The original CLI capability is also retained for an explicitly authorized legacy run:

```bash
npm run ops:deploy:tenants -- --sha "$(git rev-parse HEAD)" --output artifacts/deployment/tenant-sync.json
```

Use `--dry-run` to inspect the planned targets without contacting Vercel.

## Failure and rollback

- The synchronizer fails if the primary project does not have a ready production deployment for the exact commit.
- The synchronizer waits up to five minutes for the primary Git-integrated deployment to become ready; the retry count and delay are configurable through `PRIMARY_DEPLOYMENT_RETRY_ATTEMPTS` and `PRIMARY_DEPLOYMENT_RETRY_DELAY_MS`.
- Alias promotion happens only after the Guatemala deployment succeeds.
- Automatic RewardMe domain checks require the expected source version and fail on a mismatch. Use the prior immutable RewardMe deployment for a RewardMe-only rollback; do not retarget unrelated aliases.
- Only during an authorized legacy multi-project rollback, use the prior deployments and alias mapping recorded before that legacy operation. Never use a different source commit for only one tenant in that explicitly synchronized legacy group.
