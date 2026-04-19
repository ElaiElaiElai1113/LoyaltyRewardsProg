import type {
  Activity,
  BusinessWithMetrics,
  OrderForVerification,
  Profile,
  Redemption,
} from '@/types/domain'
import type { RewardAdjustmentFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'

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
  async getBusinessesWithMetrics(): Promise<BusinessWithMetrics[]> {
    const sb = requireSupabase()

    const [businessesResult, ordersResult, activitiesResult, profilesResult, balancesResult] =
      await Promise.all([
        sb.from('businesses').select('*').order('name'),
        sb.from('orders').select('business_id, profile_id, total'),
        sb.from('activities').select('business_id, points').eq('type', 'earned'),
        sb.from('profiles').select('id, business_id'),
        sb.from('reward_balances').select('profile_id, available_credits'),
      ])

    if (businessesResult.error) throw new Error('Failed to load businesses.')
    if (ordersResult.error) throw new Error('Failed to load business order metrics.')
    if (activitiesResult.error) throw new Error('Failed to load business activity metrics.')
    if (profilesResult.error) throw new Error('Failed to load business credit metrics.')
    if (balancesResult.error) throw new Error('Failed to load member credit balances.')

    const memberIdsByBusiness = new Map<string, Set<string>>()
    const revenueByBusiness = new Map<string, number>()

    for (const order of ordersResult.data ?? []) {
      const businessId = order.business_id as string | null
      const profileId = order.profile_id as string | null
      if (!businessId) continue

      if (profileId) {
        const memberSet = memberIdsByBusiness.get(businessId) ?? new Set<string>()
        memberSet.add(profileId)
        memberIdsByBusiness.set(businessId, memberSet)
      }

      revenueByBusiness.set(
        businessId,
        (revenueByBusiness.get(businessId) ?? 0) + Number(order.total ?? 0),
      )
    }

    const pointsIssuedByBusiness = new Map<string, number>()
    for (const activity of activitiesResult.data ?? []) {
      const businessId = activity.business_id as string | null
      if (!businessId) continue

      pointsIssuedByBusiness.set(
        businessId,
        (pointsIssuedByBusiness.get(businessId) ?? 0) + Number(activity.points ?? 0),
      )
    }

    const businessIdByProfile = new Map<string, string>()
    for (const profile of profilesResult.data ?? []) {
      if (typeof profile.id === 'string' && typeof profile.business_id === 'string') {
        businessIdByProfile.set(profile.id, profile.business_id)
      }
    }

    const creditsOutstandingByBusiness = new Map<string, number>()
    for (const balance of balancesResult.data ?? []) {
      const profileId = balance.profile_id as string | null
      if (!profileId) continue

      const businessId = businessIdByProfile.get(profileId)
      if (!businessId) continue

      creditsOutstandingByBusiness.set(
        businessId,
        (creditsOutstandingByBusiness.get(businessId) ?? 0) + Number(balance.available_credits ?? 0),
      )
    }

    return (businessesResult.data ?? []).map((row) => {
      const business = camelCaseRow(row as Record<string, unknown>)
      const businessId = business.id as string

      return {
        id: businessId,
        name: business.name as string,
        slug: business.slug as string,
        description: (business.description as string | null) ?? null,
        earnRate: Number(business.earnRate ?? 0),
        currency: (business.currency as string) || 'USD',
        active: Boolean(business.active),
        logoUrl: (business.logoUrl as string | null) ?? null,
        totalMembers: memberIdsByBusiness.get(businessId)?.size ?? 0,
        totalRevenue: revenueByBusiness.get(businessId) ?? 0,
        pointsIssued: pointsIssuedByBusiness.get(businessId) ?? 0,
        creditsOutstanding: creditsOutstandingByBusiness.get(businessId) ?? 0,
      }
    })
  },

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

  async updateBusiness(
    id: string,
    patch: { name?: string; description?: string; logoUrl?: string },
  ) {
    const sb = requireSupabase()
    const snakePatch = snakeCaseObj(patch as Record<string, unknown>)

    const { data, error } = await sb
      .from('businesses')
      .update(snakePatch)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to update business.')
    }

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: 'Platform Admin',
      action: 'business_info_updated',
      details: JSON.stringify(patch),
    })

    if (logError) {
      console.error('Admin log error:', logError)
    }

    return camelCaseRow(data as Record<string, unknown>)
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

  async getOrdersForVerification(businessId?: string): Promise<OrderForVerification[]> {
    const sb = requireSupabase()

    let query = sb
      .from('orders')
      .select('id, profile_id, business_id, total, points_earned, created_at, businesses(name, earn_rate)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Failed to load orders for verification.')
    }

    return (data ?? []).map((row) => {
      const order = camelCaseRow(row as Record<string, unknown>)
      const rawBusinesses = (row as { businesses?: unknown }).businesses
      const businessRow = Array.isArray(rawBusinesses)
        ? ((rawBusinesses[0] as Record<string, unknown> | undefined) ?? null)
        : ((rawBusinesses as Record<string, unknown> | null | undefined) ?? null)
      const earnRate = Number(businessRow?.earn_rate ?? 0)
      const total = Number(order.total ?? 0)
      const pointsEarned = Number(order.pointsEarned ?? 0)
      const expectedPoints = Math.floor(total * earnRate)

      return {
        id: order.id as string,
        profileId: order.profileId as string,
        businessId: order.businessId as string,
        businessName: (businessRow?.name as string) ?? 'Unknown Partner',
        total,
        pointsEarned,
        expectedPoints,
        mismatch: pointsEarned !== expectedPoints,
        createdAt: order.createdAt as string,
      }
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
