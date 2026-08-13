import { describe, expect, it } from 'vitest'

import {
  WONDERTOWN_TEST_ACCOUNTS,
  WONDERTOWN_TEST_PASSWORD,
} from '@/features/auth/wondertown-test-accounts'

describe('Wondertown public test accounts', () => {
  it('publishes the permanent fictional roles with the shared test password', () => {
    expect(WONDERTOWN_TEST_PASSWORD).toBe('Rewards 123!')
    expect(WONDERTOWN_TEST_ACCOUNTS.map(({ email, portal, role }) => ({ email, portal, role }))).toEqual([
      { email: 'member@wondertown.test', portal: 'member', role: 'customer' },
      { email: 'neighbor@wondertown.test', portal: 'member', role: 'customer' },
      { email: 'owner@wondertown.test', portal: 'business', role: 'business-owner' },
      { email: 'staff@wondertown.test', portal: 'business', role: 'business-staff' },
      { email: 'admin@rewardsplatform.test', portal: 'admin', role: 'platform-admin' },
    ])
  })
})
