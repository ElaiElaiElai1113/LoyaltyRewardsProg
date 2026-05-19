import type {
  Activity,
  BusinessWithMetrics,
  OrderForVerification,
  Profile,
  Redemption,
} from '@/types/domain'
import type { RewardAdjustmentFormValues } from '@/types/forms'
import { MEMBER_VERIFICATION_BUCKET } from '@/lib/member-verification'
import { requireSupabase, camelCaseRow, friendlySupabaseError, snakeCaseObj } from './shared'

function toTierProgress(points: number, target: number) {
  return Math.max(0, Math.min(100, Math.round((points / target) * 100)))
}

type AdjustmentContext = {
  businessId?: string
}

async function performRewardAdjustment(
  values: RewardAdjustmentFormValues,
  context: AdjustmentContext,
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

  const { data: balance, error: adjustmentError } = await sb.rpc('adjust_member_points', {
    p_profile_id: values.profileId,
    p_delta: values.delta,
    p_reason: values.reason,
    p_business_id: context.businessId ?? null,
  })

  if (adjustmentError || !balance) {
    throw new Error(friendlySupabaseError(adjustmentError, 'Failed to adjust rewards.'))
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
        sb.from('profiles').select('id, business_id, role, full_name, email'),
        sb.from('reward_balances').select('profile_id, available_credits'),
      ])

    if (businessesResult.error) throw new Error('Failed to load businesses.')
    if (ordersResult.error) throw new Error('Failed to load business order metrics.')
    if (activitiesResult.error) throw new Error('Failed to load business activity metrics.')
    if (profilesResult.error) throw new Error('Failed to load business reward credit metrics.')
    if (balancesResult.error) throw new Error('Failed to load member reward credit balances.')

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
    const ownerByBusiness = new Map<string, { id: string; fullName: string; email: string }>()
    const staffCountByBusiness = new Map<string, number>()
    for (const profile of profilesResult.data ?? []) {
      if (typeof profile.id === 'string' && typeof profile.business_id === 'string') {
        businessIdByProfile.set(profile.id, profile.business_id)
      }

      if (typeof profile.business_id !== 'string') continue

      if (profile.role === 'business-owner') {
        ownerByBusiness.set(profile.business_id, {
          id: profile.id as string,
          fullName: (profile.full_name as string | null) ?? (profile.email as string),
          email: profile.email as string,
        })
      }

      if (profile.role === 'business-staff') {
        staffCountByBusiness.set(
          profile.business_id,
          (staffCountByBusiness.get(profile.business_id) ?? 0) + 1,
        )
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
        ownerProfileId: (business.ownerProfileId as string | null) ?? ownerByBusiness.get(businessId)?.id ?? null,
        ownerName: ownerByBusiness.get(businessId)?.fullName ?? null,
        ownerEmail: ownerByBusiness.get(businessId)?.email ?? null,
        staffCount: staffCountByBusiness.get(businessId) ?? 0,
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

    const profiles = (profileRows as Record<string, unknown>[]).map((row) => {
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

    await Promise.all(
      profiles.map(async ({ profile }) => {
        if (!profile.verificationDocumentPath) return

        const { data, error } = await sb.storage
          .from(MEMBER_VERIFICATION_BUCKET)
          .createSignedUrl(profile.verificationDocumentPath, 60 * 60)

        if (!error && data?.signedUrl) {
          profile.verificationDocumentUrl = data.signedUrl
        }
      }),
    )

    return profiles
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
    void actor
    await performRewardAdjustment(values, {
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

  async createBusiness(input: {
    name: string
    slug: string
    description?: string
    logoUrl?: string
    earnRate: number
    taxRate: number
    currency: string
    active: boolean
  }) {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('create_managed_business', {
      p_name: input.name.trim(),
      p_slug: input.slug.trim(),
      p_description: input.description?.trim() ?? '',
      p_logo_url: input.logoUrl?.trim() ? input.logoUrl.trim() : null,
      p_earn_rate: input.earnRate,
      p_tax_rate: input.taxRate,
      p_currency: input.currency.trim().toUpperCase(),
      p_active: input.active,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create business.')
    }

    return camelCaseRow(data as Record<string, unknown>)
  },

  async lookupUserByEmail(email: string): Promise<string | null> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('lookup_user_by_email', {
      p_email: email,
    })

    if (error) {
      throw error
    }

    return typeof data === 'string' ? data : null
  },

  async assignBusinessUser(
    userId: string,
    businessId: string,
    role: 'business-owner' | 'business-staff',
  ) {
    const sb = requireSupabase()

    const { error } = await sb.rpc('assign_business_user', {
      target_user_id: userId,
      target_role: role,
      target_business_id: businessId,
    })

    if (error) {
      throw error
    }
  },

  async assignBusinessOwner(userId: string, businessId: string) {
    await this.assignBusinessUser(userId, businessId, 'business-owner')
  },

  async assignBusinessStaff(userId: string, businessId: string) {
    await this.assignBusinessUser(userId, businessId, 'business-staff')
  },

  async adjustRewardsForBusiness(
    values: RewardAdjustmentFormValues,
    actor: Profile,
    businessId: string,
  ) {
    void actor
    await performRewardAdjustment(values, {
      businessId,
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

  async reviewMemberVerification(
    profileId: string,
    status: 'verified' | 'rejected',
    reason?: string,
  ): Promise<Profile> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('review_member_verification', {
      p_profile_id: profileId,
      p_status: status,
      p_reason: reason ?? null,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to review member verification.')
    }

    const row = Array.isArray(data) ? data[0] : data
    return camelCaseRow(row as Record<string, unknown>) as unknown as Profile
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
