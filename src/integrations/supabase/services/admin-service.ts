import { readStore, updateStore } from '@/lib/mock-store'
import type { Profile } from '@/types/domain'
import type { RewardAdjustmentFormValues } from '@/types/forms'

import { delay } from './shared'

function recalculateTierProgress(points: number, target: number) {
  return Math.max(0, Math.min(100, Math.round((points / target) * 100)))
}

export const adminService = {
  async getUsers() {
    await delay()

    const store = readStore()

    return store.profiles.map((profile) => ({
      profile,
      balance: store.balances.find((balance) => balance.profileId === profile.id) ?? null,
    }))
  },

  async getOverview() {
    await delay()
    const store = readStore()

    return {
      redemptions: store.redemptions.sort((a, b) => b.redeemedAt.localeCompare(a.redeemedAt)),
      adminLogs: store.adminLogs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      activities: store.activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }
  },

  async adjustRewards(values: RewardAdjustmentFormValues, actor: Profile) {
    await delay()

    const store = readStore()
    const target = store.profiles.find((profile) => profile.id === values.profileId)

    if (!target) {
      throw new Error('Member not found.')
    }

    updateStore((currentStore) => ({
      ...currentStore,
      balances: currentStore.balances.map((balance) =>
        balance.profileId === values.profileId
          ? {
              ...balance,
              points: Math.max(0, balance.points + values.delta),
              tierProgress: recalculateTierProgress(
                Math.max(0, balance.points + values.delta),
                Math.max(balance.nextRewardPoints, 1),
              ),
            }
          : balance,
      ),
      activities: [
        {
          id: crypto.randomUUID(),
          profileId: values.profileId,
          type: 'adjustment',
          title: values.delta >= 0 ? 'Points added by staff' : 'Points deducted by staff',
          description: values.reason,
          points: values.delta,
          createdAt: new Date().toISOString(),
          status: 'posted',
        },
        ...currentStore.activities,
      ],
      adminLogs: [
        {
          id: crypto.randomUUID(),
          actorName: actor.fullName,
          action: 'Manual reward adjustment',
          details: `${values.delta >= 0 ? 'Added' : 'Deducted'} ${Math.abs(values.delta)} points for ${target.fullName}.`,
          createdAt: new Date().toISOString(),
        },
        ...currentStore.adminLogs,
      ],
    }))
  },
}
