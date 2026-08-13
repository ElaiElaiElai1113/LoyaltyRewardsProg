import {
  REWARDME_TEST_PASSWORD,
  type RewardMeTestAccount,
} from '@/features/auth/rewardme-test-accounts'

export const WONDERTOWN_TEST_PASSWORD = REWARDME_TEST_PASSWORD

export const WONDERTOWN_TEST_ACCOUNTS: readonly RewardMeTestAccount[] = [
  {
    email: 'member@wondertown.test',
    label: 'Member',
    portal: 'member',
    portalPath: '/signin',
    role: 'customer',
  },
  {
    email: 'neighbor@wondertown.test',
    label: 'Second member',
    portal: 'member',
    portalPath: '/signin',
    role: 'customer',
  },
  {
    email: 'owner@wondertown.test',
    label: 'Business owner',
    portal: 'business',
    portalPath: '/business/login',
    role: 'business-owner',
  },
  {
    email: 'staff@wondertown.test',
    label: 'Business staff',
    portal: 'business',
    portalPath: '/business/login',
    role: 'business-staff',
  },
  {
    email: 'admin@rewardsplatform.test',
    label: 'Platform admin',
    portal: 'admin',
    portalPath: '/admin',
    role: 'platform-admin',
  },
] as const
