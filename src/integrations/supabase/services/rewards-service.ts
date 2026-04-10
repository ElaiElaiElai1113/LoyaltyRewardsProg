import { readStore, updateStore } from '@/lib/mock-store'
import type { Redemption, Reward } from '@/types/domain'
import type { RedeemFormValues, RewardDraftFormValues } from '@/types/forms'

import { profileService } from './profile-service'
import { delay } from './shared'

interface RedeemInput extends RedeemFormValues {
  profileId: string
  rewardId: string
}

function toTierProgress(points: number, nextRewardPoints: number) {
  return Math.max(0, Math.min(100, Math.round((points / nextRewardPoints) * 100)))
}

export const rewardsService = {
  async getRewards() {
    await delay()
    return readStore().rewards.sort((a, b) => Number(b.featured) - Number(a.featured))
  },

  async getRewardById(rewardId: string) {
    await delay()
    return readStore().rewards.find((reward) => reward.id === rewardId) ?? null
  },

  async redeemReward(input: RedeemInput) {
    await delay()

    const reward = readStore().rewards.find((item) => item.id === input.rewardId)

    if (!reward) {
      throw new Error('Reward not found.')
    }

    if (reward.inventory <= 0) {
      throw new Error('That reward is currently out of stock.')
    }

    const balance = await profileService.ensureBalance(input.profileId)

    if (balance.points < reward.pointsCost) {
      throw new Error('You do not have enough points for this reward yet.')
    }

    const redemption: Redemption = {
      id: crypto.randomUUID(),
      profileId: input.profileId,
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsCost: reward.pointsCost,
      notes: input.notes,
      redeemedAt: new Date().toISOString(),
      status: 'ready',
    }

    updateStore((store) => ({
      ...store,
      rewards: store.rewards.map((item) =>
        item.id === reward.id ? { ...item, inventory: item.inventory - 1 } : item,
      ),
      balances: store.balances.map((item) =>
        item.profileId === input.profileId
          ? {
              ...item,
              points: item.points - reward.pointsCost,
              tierProgress: toTierProgress(
                item.points - reward.pointsCost,
                Math.max(item.nextRewardPoints, 1),
              ),
            }
          : item,
      ),
      redemptions: [redemption, ...store.redemptions],
      activities: [
        {
          id: crypto.randomUUID(),
          profileId: input.profileId,
          type: 'redeemed',
          title: `${reward.title} redeemed`,
          description: `${input.pickupWindow} pickup selected${input.notes ? ` • ${input.notes}` : ''}`,
          points: -reward.pointsCost,
          createdAt: redemption.redeemedAt,
          status: 'posted',
        },
        ...store.activities,
      ],
    }))

    return redemption
  },

  async createReward(values: RewardDraftFormValues) {
    await delay()

    const reward: Reward = {
      id: crypto.randomUUID(),
      ...values,
      inventory: 30,
      featured: false,
    }

    updateStore((store) => ({
      ...store,
      rewards: [reward, ...store.rewards],
      adminLogs: [
        {
          id: crypto.randomUUID(),
          actorName: 'Velvet Brew Admin',
          action: 'Reward created',
          details: `Added ${reward.title} to the catalog.`,
          createdAt: new Date().toISOString(),
        },
        ...store.adminLogs,
      ],
    }))

    return reward
  },
}
