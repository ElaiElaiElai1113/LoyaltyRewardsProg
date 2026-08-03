# Rewards repository strategy

The Rewards Platform and its four rewards tenants remain in one GitHub
repository: `ElaiElaiElai1113/LoyaltyRewardsProg`.

## Why one repository

- Medellín, Pinas, Guatemala, and Wondertown use the same tested application,
  database migrations, and release controls.
- Tenant branding and hostname configuration provide the separation; duplicate
  repositories would create drift and make security fixes easier to miss.
- One commit can be verified against all tenant hostnames before it is released.
- Git history, CI evidence, and production rollback remain in one place.

## Tenant deployments

| Tenant | Purpose | Deployment source |
| --- | --- | --- |
| Medellín Rewards | Live white-label tenant | This repository, tenant hostname/configuration |
| Pinas Rewards | Flagship Philippines tenant | This repository, tenant hostname/configuration |
| Guatemala Rewards | Live white-label tenant | This repository, tenant hostname/configuration |
| Wondertown Rewards | Fictional end-to-end demo | This repository, tenant hostname/configuration |

Synergize Business Group remains a separate application and repository. It is
tested alongside the Rewards sites, but it must not be copied into the Rewards
tenant configuration or share a Rewards deployment.

## GitHub Desktop

Clone or add `LoyaltyRewardsProg` once. Pinas and Wondertown do not appear as
separate repositories because they are tenant deployments from this same source.
Switching GitHub accounts does not remove local files or Supabase data; it only
changes which GitHub identity is used to fetch and push.
