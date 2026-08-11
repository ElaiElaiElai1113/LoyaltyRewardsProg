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

## Provisioning and verification

Run the approved RewardMe fixture provisioner with `QA_PROGRAM_SLUG=pinas`. It creates or updates the four isolated accounts, attaches the member and business roles to the RewardMe program, assigns owner and staff to the designated QA business, resets the shared password through the Supabase Admin API, and verifies password login for every account.

Never expose or commit `SUPABASE_SERVICE_ROLE_KEY`. Password updates must continue through the server-side Admin API; do not update password hashes with database SQL.

## Removal before public launch

1. Remove the public credential panel from all three sign-in routes.
2. Rotate or disable every account above.
3. Remove the shared password from documentation and environment examples.
4. Repeat authenticated role, tenant-isolation, and responsive Playwright checks.
