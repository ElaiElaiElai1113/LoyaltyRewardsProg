import { describe, expect, it } from 'vitest'

import { resolveTenantDatabaseHostname } from './_tenant-host-alias'

describe('tenant hostname aliases', () => {
  it('maps the RewardMe Vercel redirect target to the canonical tenant domain', () => {
    expect(resolveTenantDatabaseHostname('rewardme-prod.vercel.app'))
      .toBe('loyalty-rewards-prog.vercel.app')
  })

  it.each(['myrewardme.com', 'www.myrewardme.com'])(
    'maps the owned custom hostname %s to RewardMe',
    (hostname) => {
      expect(resolveTenantDatabaseHostname(hostname)).toBe('loyalty-rewards-prog.vercel.app')
    },
  )

  it('normalizes and preserves registered tenant hostnames', () => {
    expect(resolveTenantDatabaseHostname('WONDERTOWN-REWARDS.VERCEL.APP:443'))
      .toBe('wondertown-rewards.vercel.app')
  })
})
