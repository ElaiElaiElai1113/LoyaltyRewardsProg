import type { Profile, RewardBalance } from '@/types/domain'
import type { ProfileFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'

function toTierProgress(points: number, nextRewardPoints: number) {
  return Math.max(0, Math.min(100, Math.round((points / nextRewardPoints) * 100)))
}

export const profileService = {
  async getProfile(profileId: string): Promise<Profile | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error || !data) return null
    return camelCaseRow(data) as unknown as Profile
  },

  async getRewardBalance(profileId: string): Promise<RewardBalance | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('reward_balances')
      .select('*')
      .eq('profile_id', profileId)
      .single()

    if (error || !data) return null

    const mapped = camelCaseRow(data) as Record<string, unknown>
    return {
      profileId: mapped.profileId as string,
      points: mapped.points as number,
      nextRewardPoints: mapped.nextRewardPoints as number,
      availableCredits: mapped.availableCredits as number,
      tierProgress: toTierProgress(mapped.points as number, mapped.nextRewardPoints as number),
    }
  },

  async updateProfile(profileId: string, values: ProfileFormValues): Promise<Profile> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('profiles')
      .update(snakeValues)
      .eq('id', profileId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to update profile.')
    }

    return camelCaseRow(data) as unknown as Profile
  },

  async ensureBalance(profileId: string): Promise<RewardBalance> {
    const existing = await this.getRewardBalance(profileId)
    if (existing) return existing

    const sb = requireSupabase()

    const { data, error } = await sb
      .from('reward_balances')
      .insert({ profile_id: profileId })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to create balance.')
    }

    const mapped = camelCaseRow(data) as Record<string, unknown>
    return {
      profileId: mapped.profileId as string,
      points: mapped.points as number,
      nextRewardPoints: mapped.nextRewardPoints as number,
      availableCredits: mapped.availableCredits as number,
      tierProgress: 0,
    }
  },
}
