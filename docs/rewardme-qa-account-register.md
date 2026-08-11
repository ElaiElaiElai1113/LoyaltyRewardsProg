# RewardMe QA account register

The following deliberately public credentials are for temporary RewardMe testing only. They must use isolated QA data and must be removed from the sign-in pages before public launch.

| Role | Username | Sign-in route |
|---|---|---|
| Member | `member@rewardme.test` | `/signin` |
| Business owner | `owner@rewardme.test` | `/business/login` |
| Business staff | `staff@rewardme.test` | `/business/login` |
| Platform administrator | `admin@rewardsplatform.test` | `/admin` |

Shared testing password: `Rewards 123!`

The password is intentionally 12 characters so it satisfies the production QA tooling's minimum length. The website provides a **Use account** action on the correct portal and links every other account to its matching portal.

Current production QA status: all four accounts are provisioned and their live
portal destinations have passed the published-account Playwright gate. RewardMe
tenant isolation and mobile authenticated access have also passed the hosted-safe
suite. A server-generated recovery link also resolves to the allowlisted
RewardMe `/reset-password` route without sending or logging the recovery token.

## Provisioning and verification

Run the approved RewardMe fixture provisioner with `QA_PROGRAM_SLUG=pinas`. It creates or updates the four isolated accounts, attaches the member and business roles to the RewardMe program, assigns owner and staff to the designated QA business, verifies the member, resets the shared password through the Supabase Admin API, and verifies password login for every account. It also creates an idempotent QA partner, member balance, customer link, product, reward, gift-card catalog item, recorded purchase, activity history, and issued gift card so authenticated screens do not end in empty states.

On the authorized Windows release workstation, the production wrapper retrieves
the project API keys from the Supabase Management API into process memory, runs
the provisioner and browser checks, restores the prior environment, and never
writes or prints either server key:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/provision-rewardme-production-qa.ps1 -Apply -RunAuthenticatedChecks
```

Omit `-Apply` for a read-only key-availability preflight.

After provisioning, verify the exact credentials published by the deployed website:

```powershell
npm run test:e2e:rewardme-accounts
```

The command deliberately fails if any published account cannot reach its correct authenticated portal.

Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`. Password updates must continue through the server-side Admin API; do not update password hashes with database SQL.

## Removal before public launch

1. Set `VITE_SHOW_PUBLIC_QA_CREDENTIALS=false` in the deployment environment and redeploy. This removes the public credential panel from all three sign-in routes without a code change.
2. Rotate or disable every account above.
3. Remove the shared password from documentation and environment examples.
4. Repeat authenticated role, tenant-isolation, and responsive Playwright checks.

Before changing the production environment, verify the release shutoff locally:

```powershell
npm run test:e2e:rewardme-release-mode
```

This command starts RewardMe with the credential switch disabled and fails if any
published username or the shared password remains visible on a sign-in portal.
