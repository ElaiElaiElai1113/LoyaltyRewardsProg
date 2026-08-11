import type { AuthFormValues } from '@/types/forms'

export const REWARDME_TEST_PASSWORD = 'Rewards 123!'

export type RewardMeTestPortal = 'member' | 'business' | 'admin'

export type RewardMeTestAccount = {
  email: string
  label: string
  portal: RewardMeTestPortal
  portalPath: string
  role: AuthFormValues['role']
}

export const REWARDME_TEST_ACCOUNTS: readonly RewardMeTestAccount[] = [
  {
    email: 'member@rewardme.test',
    label: 'Member',
    portal: 'member',
    portalPath: '/signin',
    role: 'customer',
  },
  {
    email: 'owner@rewardme.test',
    label: 'Business owner',
    portal: 'business',
    portalPath: '/business/login',
    role: 'business-owner',
  },
  {
    email: 'staff@rewardme.test',
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
