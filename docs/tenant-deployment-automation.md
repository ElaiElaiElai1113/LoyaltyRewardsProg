# Tenant deployment automation

The Rewards repository has two Vercel projects and two deployment aliases:

- `loyalty-rewards-prog` automatically builds the Medellin production release.
- `guatemala-rewards` receives the same validated commit through a separate production deployment.
- `pinas-rewards.vercel.app` and `wondertown-rewards.vercel.app` are aliases of the exact Medellin/primary deployment.

The `Tenant deployment synchronization` GitHub workflow runs only after the `CI` workflow passes on `main`. It resolves the ready primary deployment by the complete Git commit SHA, deploys that checkout to the Guatemala project with an explicit health-version marker, updates both aliases, and verifies that all four canonical domains report the same version.

## Required GitHub settings

1. Create a repository Actions secret named `VERCEL_TOKEN` using a scoped Vercel automation token.
2. Create a repository Actions variable named `ENABLE_TENANT_DEPLOYMENT_SYNC` with the value `true` after the first manual rehearsal succeeds.
3. Optionally set `VERCEL_SCOPE`; it defaults to `elaielaielai1113s-projects`.

The project names can be overridden with `VERCEL_PRIMARY_PROJECT` and `VERCEL_GUATEMALA_PROJECT` when running the script outside GitHub Actions.

## Manual rehearsal

Run the workflow manually with the complete commit SHA, or use an authenticated Vercel CLI session locally:

```bash
npm run ops:deploy:tenants -- --sha "$(git rev-parse HEAD)" --output artifacts/deployment/tenant-sync.json
```

Use `--dry-run` to inspect the planned targets without contacting Vercel.

## Failure and rollback

- The synchronizer fails if the primary project does not have a ready production deployment for the exact commit.
- The synchronizer waits up to five minutes for the primary Git-integrated deployment to become ready; the retry count and delay are configurable through `PRIMARY_DEPLOYMENT_RETRY_ATTEMPTS` and `PRIMARY_DEPLOYMENT_RETRY_DELAY_MS`.
- Alias promotion happens only after the Guatemala deployment succeeds.
- Canonical domain checks require the exact commit version and fail the workflow on any mismatch.
- To roll back, use the previous immutable deployment URL recorded by Vercel, restore the Pinas and Wondertown aliases with `vercel alias set`, and roll back the two production projects through their Vercel deployment history. Never use a different source commit for only one tenant.
