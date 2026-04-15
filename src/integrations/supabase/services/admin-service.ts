import type { Activity, Profile, Redemption } from '@/types/domain'
import type { RewardAdjustmentFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow } from './shared'

function toTierProgress(points: number, target: number) {
  return Math.max(0, Math.min(100, Math.round((points / target) * 100)))
}

type AdjustmentLogContext = {
  actorName: string
  adminAction: string
  businessId?: string
  addedTitle: string
  deductedTitle: string
}

async function performRewardAdjustment(
  values: RewardAdjustmentFormValues,
  context: AdjustmentLogContext,
) {
  const sb = requireSupabase()

  const { data: target, error: targetError } = await sb
    .from('profiles')
    .select('*')
    .eq('id', values.profileId)
    .single()

  if (targetError || !target) {
    throw new Error('Member not found.')
  }

  const { data: balance, error: balError } = await sb
    .from('reward_balances')
    .select('*')
    .eq('profile_id', values.profileId)
    .single()

  if (balError || !balance) {
    throw new Error('Balance not found.')
  }

  const newPoints = Math.max(0, balance.points + values.delta)
  const actualDelta = newPoints - balance.points

  const { error: updateError } = await sb
    .from('reward_balances')
    .update({ points: newPoints })
    .eq('profile_id', values.profileId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  const { error: activityError } = await sb.from('activities').insert({
    profile_id: values.profileId,
    business_id: context.businessId,
    type: 'adjustment',
    title: actualDelta >= 0 ? context.addedTitle : context.deductedTitle,
    description: values.reason,
    points: actualDelta,
    status: 'posted',
  })

  if (activityError) {
    console.error('Activity log error:', activityError)
    throw new Error(activityError.message)
  }

  const { error: logError } = await sb.from('admin_logs').insert({
    actor_name: context.actorName,
    action: context.adminAction,
    details: `${actualDelta >= 0 ? 'Added' : 'Deducted'} ${Math.abs(actualDelta)} points for member ${values.profileId}. Reason: ${values.reason}`,
  })

  if (logError) {
    console.error('Admin log error:', logError)
  }
}

export const adminService = {
  async getUsers() {
    const sb = requireSupabase()

    const { data: profileRows, error: profError } = await sb
      .from('profiles')
      .select('*')

    if (profError) throw new Error('Failed to load users.')

    const { data: balanceRows, error: balError } = await sb
      .from('reward_balances')
      .select('*')

    if (balError) throw new Error('Failed to load balances.')

    const balanceMap = new Map(
      (balanceRows as Record<string, unknown>[]).map((b) => {
        const mapped = camelCaseRow(b)
        return [mapped.profileId as string, mapped]
      }),
    )

    return (profileRows as Record<string, unknown>[]).map((row) => {
      const profile = camelCaseRow(row) as unknown as Profile
      const rawBalance = balanceMap.get(profile.id)
      const balance = rawBalance
        ? {
            profileId: rawBalance.profileId as string,
            points: rawBalance.points as number,
            nextRewardPoints: rawBalance.nextRewardPoints as number,
            availableCredits: rawBalance.availableCredits as number,
            tierProgress: toTierProgress(rawBalance.points as number, rawBalance.nextRewardPoints as number),
          }
        : null
      return { profile, balance }
    })
  },

  async getOverview() {
    const sb = requireSupabase()

    const [redemptionsResult, logsResult, activitiesResult] = await Promise.all([
      sb.from('redemptions').select('*').order('redeemed_at', { ascending: false }),
      sb.from('admin_logs').select('*').order('created_at', { ascending: false }),
      sb.from('activities').select('*').order('created_at', { ascending: false }),
    ])

    const redemptions = (redemptionsResult.data ?? []).map((r) => {
      const m = camelCaseRow(r as Record<string, unknown>)
      return {
        id: m.id as string,
        profileId: m.profileId as string,
        rewardId: m.rewardId as string,
        rewardTitle: m.rewardTitle as string,
        pointsCost: m.pointsCost as number,
        notes: m.notes as string | undefined,
        redeemedAt: m.redeemedAt as string,
        status: m.status as Redemption['status'],
      }
    })

    const adminLogs = (logsResult.data ?? []).map((l) => {
      const m = camelCaseRow(l as Record<string, unknown>)
      return {
        id: m.id as string,
        actorName: m.actorName as string,
        action: m.action as string,
        details: m.details as string,
        createdAt: m.createdAt as string,
      }
    })

    const activities = (activitiesResult.data ?? []).map((a) => {
      const m = camelCaseRow(a as Record<string, unknown>)
      return {
        id: m.id as string,
        profileId: m.profileId as string,
        type: m.type as Activity['type'],
        title: m.title as string,
        description: m.description as string,
        points: m.points as number,
        createdAt: m.createdAt as string,
        status: m.status as Activity['status'],
      }
    })

    return { redemptions, adminLogs, activities }
  },

  async adjustRewards(values: RewardAdjustmentFormValues, actor: Profile) {
    await performRewardAdjustment(values, {
      actorName: actor?.fullName || 'Platform Admin',
      adminAction: 'Points Adjustment',
      addedTitle: 'Points added by staff',
      deductedTitle: 'Points deducted by staff',
    })
  },

  async adjustRewardsForBusiness(
    values: RewardAdjustmentFormValues,
    actor: Profile,
    businessId: string,
  ) {
    await performRewardAdjustment(values, {
      actorName: actor?.fullName || 'Business Owner',
      adminAction: 'Business Points Adjustment',
      businessId,
      addedTitle: 'Points added by business',
      deductedTitle: 'Points deducted by business',
    })
  },

  async fulfillRedemption(redemptionId: string, actor: Profile) {
    const sb = requireSupabase()

    // Fetch redemption
    const { data: redemption, error: fetchError } = await sb
      .from('redemptions')
      .select('*')
      .eq('id', redemptionId)
      .single()

    if (fetchError || !redemption) {
      throw new Error('Redemption not found.')
    }

    // Update status
    const { error: updateError } = await sb
      .from('redemptions')
      .update({ status: 'fulfilled' })
      .eq('id', redemptionId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Log admin action
    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actor.fullName,
      action: 'Redemption fulfilled',
      details: `Marked reward "${redemption.reward_title}" as fulfilled for member ID: ${redemption.profile_id}.`,
    })

    if (logError) {
      throw new Error(logError.message)
    }
  },
}
