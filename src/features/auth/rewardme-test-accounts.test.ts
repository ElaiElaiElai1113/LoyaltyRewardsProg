import { describe, expect, it } from 'vitest'

import {
  REWARDME_TEST_ACCOUNTS,
  REWARDME_TEST_PASSWORD,
  shouldShowRewardMeTestCredentials,
} from '@/features/auth/rewardme-test-accounts'

describe('RewardMe temporary test accounts', () => {
  it('publishes only the approved temporary account register', () => {
    expect(REWARDME_TEST_PASSWORD).toBe('Rewards 123!')
    expect(REWARDME_TEST_ACCOUNTS.map(({ email, portal, role }) => ({ email, portal, role }))).toEqual([
      { email: 'member@rewardme.test', portal: 'member', role: 'customer' },
      { email: 'owner@rewardme.test', portal: 'business', role: 'business-owner' },
      { email: 'staff@rewardme.test', portal: 'business', role: 'business-staff' },
      { email: 'admin@rewardsplatform.test', portal: 'admin', role: 'platform-admin' },
    ])
  })

  it('provides a one-setting launch shutoff for the public credential panel', () => {
    expect(shouldShowRewardMeTestCredentials(undefined)).toBe(true)
    expect(shouldShowRewardMeTestCredentials('true')).toBe(true)
    expect(shouldShowRewardMeTestCredentials('false')).toBe(false)
  })
})
