import type { Redemption, Reward } from '@/types/domain'
import type { RedeemFormValues, RewardDraftFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'
import { profileService } from './profile-service'

interface RedeemInput extends RedeemFormValues {
  profileId: string
  rewardId: string
}

export const rewardsService = {
  async getRewards(businessId?: string): Promise<Reward[]> {
    const sb = requireSupabase()

    let query = sb.from('rewards').select('*')
    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load rewards.')

    return (data as Record<string, unknown>[])
      .map((row) => camelCaseRow(row) as unknown as Reward)
      .sort((a, b) => Number(b.featured) - Number(a.featured))
  },

  async getRewardById(rewardId: string): Promise<Reward | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('rewards')
      .select('*')
      .eq('id', rewardId)
      .single()

    if (error || !data) return null
    return camelCaseRow(data) as unknown as Reward
  },

  async redeemReward(input: RedeemInput): Promise<Redemption> {
    const sb = requireSupabase()

    // Fetch reward
    const reward = await this.getRewardById(input.rewardId)
    if (!reward) throw new Error('Reward not found.')
    if (reward.inventory <= 0) throw new Error('That reward is currently out of stock.')

    // Check balance
    const balance = await profileService.ensureBalance(input.profileId)
    if (balance.points < reward.pointsCost) {
      throw new Error('You do not have enough points for this reward yet.')
    }

    // Create redemption
    const { data: redemptionRow, error: redeemError } = await sb
      .from('redemptions')
      .insert({
        profile_id: input.profileId,
        reward_id: reward.id,
        reward_title: reward.title,
        points_cost: reward.pointsCost,
        notes: input.notes ?? null,
      })
      .select('*')
      .single()

    if (redeemError || !redemptionRow) {
      throw new Error('Failed to create redemption.')
    }

    // Decrement inventory
    await sb
      .from('rewards')
      .update({ inventory: reward.inventory - 1 })
      .eq('id', reward.id)

    // Deduct points
    const newPoints = balance.points - reward.pointsCost
    await sb
      .from('reward_balances')
      .update({ points: newPoints })
      .eq('profile_id', input.profileId)

    // Log activity
    await sb.from('activities').insert({
      profile_id: input.profileId,
      business_id: reward.businessId,
      type: 'redeemed',
      title: `${reward.title} redeemed`,
      description: `${input.pickupWindow} pickup selected${input.notes ? ` • ${input.notes}` : ''}`,
      points: -reward.pointsCost,
      status: 'posted',
    })

    const mapped = camelCaseRow(redemptionRow) as Record<string, unknown>
    return {
      id: mapped.id as string,
      profileId: mapped.profileId as string,
      rewardId: mapped.rewardId as string,
      rewardTitle: mapped.rewardTitle as string,
      pointsCost: mapped.pointsCost as number,
      notes: mapped.notes as string | undefined,
      redeemedAt: mapped.redeemedAt as string,
      status: mapped.status as 'ready' | 'fulfilled',
    }
  },

  async createReward(values: RewardDraftFormValues): Promise<Reward> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('rewards')
      .insert({ ...snakeValues, inventory: 30, featured: false })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to create reward.')
    }

    const reward = camelCaseRow(data) as unknown as Reward

    await sb.from('admin_logs').insert({
      actor_name: 'Business Owner',
      action: 'Reward created',
      details: `Added ${reward.title} to the catalog.`,
    })

    return reward
  },
}
