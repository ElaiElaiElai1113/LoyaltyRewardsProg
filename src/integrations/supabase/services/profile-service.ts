import { readStore, updateStore } from '@/lib/mock-store'
import type { Profile, RewardBalance } from '@/types/domain'
import type { ProfileFormValues } from '@/types/forms'

import { delay } from './shared'

export const profileService = {
  async getProfile(profileId: string) {
    await delay()
    return readStore().profiles.find((profile) => profile.id === profileId) ?? null
  },

  async getRewardBalance(profileId: string) {
    await delay()
    return readStore().balances.find((balance) => balance.profileId === profileId) ?? null
  },

  async updateProfile(profileId: string, values: ProfileFormValues) {
    await delay()

    let updatedProfile: Profile | null = null

    updateStore((store) => {
      const profiles = store.profiles.map((profile) => {
        if (profile.id !== profileId) {
          return profile
        }

        updatedProfile = { ...profile, ...values }
        return updatedProfile
      })

      return { ...store, profiles }
    })

    if (!updatedProfile) {
      throw new Error('Profile not found.')
    }

    return updatedProfile
  },

  async ensureBalance(profileId: string) {
    await delay()

    const existing = readStore().balances.find((balance) => balance.profileId === profileId)

    if (existing) {
      return existing
    }

    const balance: RewardBalance = {
      profileId,
      points: 0,
      nextRewardPoints: 300,
      availableCredits: 0,
      tierProgress: 0,
    }

    updateStore((store) => ({ ...store, balances: [balance, ...store.balances] }))
    return balance
  },
}
