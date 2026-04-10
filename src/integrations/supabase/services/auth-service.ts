import { getProfileByRole, readStore, setSession, updateStore } from '@/lib/mock-store'
import type { Profile, UserRole } from '@/types/domain'
import type { AuthFormValues } from '@/types/forms'

import { delay } from './shared'

function createBalance(profileId: string) {
  return {
    profileId,
    points: 120,
    nextRewardPoints: 300,
    availableCredits: 1,
    tierProgress: 18,
  }
}

export const authService = {
  async getSessionProfile() {
    await delay()

    const store = readStore()
    const session = store.session

    if (!session) {
      return null
    }

    return store.profiles.find((profile) => profile.id === session.profileId) ?? null
  },

  async signIn(input: AuthFormValues) {
    await delay()

    const store = readStore()
    const profile =
      store.profiles.find(
        (candidate) =>
          candidate.email.toLowerCase() === input.email.toLowerCase() &&
          candidate.role === input.role,
      ) ?? null

    if (!profile) {
      throw new Error('No account matches that email yet. Try creating one first.')
    }

    setSession({ profileId: profile.id, role: profile.role })
    return profile
  },

  async signUp(input: AuthFormValues) {
    await delay()

    const name = input.fullName?.trim()

    if (!name) {
      throw new Error('Enter your full name to create an account.')
    }

    const existing = readStore().profiles.find(
      (profile) => profile.email.toLowerCase() === input.email.toLowerCase(),
    )

    if (existing) {
      throw new Error('That email already exists. Try signing in instead.')
    }

    const profile: Profile = {
      id: crypto.randomUUID(),
      fullName: name,
      email: input.email,
      phone: '+1 (000) 000-0000',
      location: 'Downtown',
      favoriteOrder: 'House espresso',
      tier: 'Bronze',
      joinedAt: new Date().toISOString(),
      role: input.role,
    }

    updateStore((store) => ({
      ...store,
      profiles: [profile, ...store.profiles],
      balances: [createBalance(profile.id), ...store.balances],
      session: { profileId: profile.id, role: profile.role },
    }))

    return profile
  },

  async continueAsDemo(role: UserRole) {
    await delay(80)

    const profile = getProfileByRole(role)

    if (!profile) {
      throw new Error('Demo account is unavailable.')
    }

    setSession({ profileId: profile.id, role: profile.role })
    return profile
  },

  async signOut() {
    await delay(60)
    setSession(null)
  },
}
