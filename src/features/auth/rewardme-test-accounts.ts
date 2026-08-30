import type { AuthFormValues } from '@/types/forms'

export const REWARDME_TEST_PASSWORD = 'Rewards 123!'

export function shouldShowRewardMeTestCredentials(
  configuredValue = import.meta.env.VITE_SHOW_PUBLIC_QA_CREDENTIALS,
) {
  return configuredValue === 'true'
}

export function shouldShowQuickTestCredentials(
  programSlug: string,
  demoTenant: boolean | undefined,
  configuredValue = import.meta.env.VITE_SHOW_PUBLIC_QA_CREDENTIALS,
) {
  if (programSlug === 'wondertown') return demoTenant === true
  if (programSlug === 'pinas' || programSlug === 'rewardme') {
    return shouldShowRewardMeTestCredentials(configuredValue)
  }
  return false
}

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
    portalPath: '/signin?portal=business',
    role: 'business-owner',
  },
  {
    email: 'staff@rewardme.test',
    label: 'Business staff',
    portal: 'business',
    portalPath: '/signin?portal=business',
    role: 'business-staff',
  },
  {
    email: 'admin@rewardsplatform.test',
    label: 'Platform admin',
    portal: 'admin',
    portalPath: '/signin?portal=admin',
    role: 'platform-admin',
  },
] as const
