import type { ReferralWithProfiles } from '@/types/domain'
import { camelCaseRow, requireSupabase } from './shared'

type ProfileSummary = {
  fullName: string
  email: string
}

type ReferralRow = Record<string, unknown> & {
  referrer?: ProfileSummary | ProfileSummary[] | null
  referee?: ProfileSummary | ProfileSummary[] | null
}

type StaffReferralRow = {
  id: string
  referrer_id: string
  referee_id: string
  business_id: string | null
  status: ReferralWithProfiles['status']
  approved_by: string | null
  approved_at: string | null
  created_at: string
  referrer_full_name: string | null
  referrer_email: string | null
  referee_full_name: string | null
  referee_email: string | null
}

function firstProfile(value: ProfileSummary | ProfileSummary[] | null | undefined): ProfileSummary {
  const profile = Array.isArray(value) ? value[0] : value
  return {
    fullName: profile?.fullName ?? 'Unknown member',
    email: profile?.email ?? '',
  }
}

function mapReferral(row: ReferralRow): ReferralWithProfiles {
  const mapped = camelCaseRow(row)
  const rawReferrer = row.referrer
  const rawReferee = row.referee
  const referrer = Array.isArray(rawReferrer)
    ? rawReferrer.map((profile) => camelCaseRow(profile as unknown as Record<string, unknown>))[0]
    : rawReferrer
      ? camelCaseRow(rawReferrer as unknown as Record<string, unknown>)
      : null
  const referee = Array.isArray(rawReferee)
    ? rawReferee.map((profile) => camelCaseRow(profile as unknown as Record<string, unknown>))[0]
    : rawReferee
      ? camelCaseRow(rawReferee as unknown as Record<string, unknown>)
      : null

  return {
    id: mapped.id as string,
    referrerId: mapped.referrerId as string,
    refereeId: mapped.refereeId as string,
    businessId: (mapped.businessId as string | null) ?? null,
    status: mapped.status as ReferralWithProfiles['status'],
    approvedBy: (mapped.approvedBy as string | null) ?? null,
    approvedAt: (mapped.approvedAt as string | null) ?? null,
    createdAt: mapped.createdAt as string,
    referrer: firstProfile(referrer as ProfileSummary | null),
    referee: firstProfile(referee as ProfileSummary | null),
  }
}

function mapStaffReferral(row: StaffReferralRow): ReferralWithProfiles {
  return {
    id: row.id,
    referrerId: row.referrer_id,
    refereeId: row.referee_id,
    businessId: row.business_id,
    status: row.status,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
    referrer: {
      fullName: row.referrer_full_name || 'Unknown member',
      email: row.referrer_email || '',
    },
    referee: {
      fullName: row.referee_full_name || 'Unknown member',
      email: row.referee_email || '',
    },
  }
}

async function incrementAvailableCredit(profileId: string) {
  const sb = requireSupabase()
  const { data: balance, error: balanceError } = await sb
    .from('reward_balances')
    .select('available_credits')
    .eq('profile_id', profileId)
    .single()

  if (balanceError || !balance) {
    throw new Error('Balance not found.')
  }

  const { error: updateError } = await sb
    .from('reward_balances')
    .update({ available_credits: Number(balance.available_credits ?? 0) + 1 })
    .eq('profile_id', profileId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

function generateSixDigitCode() {
  return (crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).toString().padStart(6, '0')
}

export const referralsService = {
  async generateCreditCode(profileId: string): Promise<string> {
    const sb = requireSupabase()
    const { data: balance, error: balanceError } = await sb
      .from('reward_balances')
      .select('available_credits')
      .eq('profile_id', profileId)
      .single()

    if (balanceError || !balance) {
      throw new Error('Balance not found.')
    }

    const availableCredits = Number(balance.available_credits ?? 0)
    if (availableCredits <= 0) {
      throw new Error('No coffee credits are available for this member.')
    }

    const { error: expireError } = await sb
      .from('credit_redemptions')
      .update({ status: 'expired' })
      .eq('profile_id', profileId)
      .eq('status', 'pending')

    if (expireError) {
      throw new Error(expireError.message)
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateSixDigitCode()
      const { error: insertError } = await sb.from('credit_redemptions').insert({
        profile_id: profileId,
        code,
        expires_at: expiresAt,
      })

      if (!insertError) {
        return code
      }

      if (insertError.code !== '23505') {
        throw new Error(insertError.message)
      }
    }

    throw new Error('Could not generate a unique redemption code. Please try again.')
  },

  async validateCreditCode(code: string, businessId: string): Promise<{ profileId: string }> {
    const sb = requireSupabase()
    const normalizedCode = code.replace(/\D/g, '')

    const { data: redemption, error: lookupError } = await sb
      .from('credit_redemptions')
      .select('id, profile_id')
      .eq('code', normalizedCode)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lookupError) {
      throw new Error(lookupError.message)
    }

    if (!redemption) {
      throw new Error('Invalid or expired code')
    }

    const profileId = redemption.profile_id as string
    await referralsService.useCredit(profileId, 'Barista redemption')

    const { error: updateError } = await sb
      .from('credit_redemptions')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
        used_by_business_id: businessId,
      })
      .eq('id', redemption.id as string)
      .eq('status', 'pending')

    if (updateError) {
      throw new Error(updateError.message)
    }

    return { profileId }
  },

  async createReferral(referrerId: string, refereeId: string, businessId: string | null) {
    try {
      const sb = requireSupabase()
      const { data, error } = await sb
        .from('referrals')
        .insert({
          referrer_id: referrerId,
          referee_id: refereeId,
          business_id: businessId,
        })
        .select('*')
        .single()

      if (error || !data) {
        console.warn('Referral creation skipped:', error?.message)
        return null
      }

      return camelCaseRow(data as Record<string, unknown>)
    } catch (error) {
      console.warn('Referral creation skipped:', error)
      return null
    }
  },

  async getPendingReferrals(businessId: string): Promise<ReferralWithProfiles[]> {
    const sb = requireSupabase()
    const { data: rpcData, error: rpcError } = await sb.rpc('get_staff_referrals', {
      target_business_id: businessId,
    })

    if (!rpcError && rpcData && rpcData.length > 0) {
      return (rpcData as StaffReferralRow[])
        .filter((row) => row.status === 'pending' && row.business_id === businessId)
        .map(mapStaffReferral)
    }

    const { data, error } = await sb
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey(full_name,email),
        referee:profiles!referrals_referee_id_fkey(full_name,email)
      `)
      .eq('status', 'pending')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to load pending referrals.')
    }

    return ((data ?? []) as ReferralRow[]).map(mapReferral)
  },

  async getAllReferrals(): Promise<ReferralWithProfiles[]> {
    const sb = requireSupabase()
    const { data: rpcData, error: rpcError } = await sb.rpc('get_staff_referrals', {
      target_business_id: null,
    })

    if (!rpcError && rpcData && rpcData.length > 0) {
      return (rpcData as StaffReferralRow[]).map(mapStaffReferral)
    }

    const { data, error } = await sb
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey(full_name,email),
        referee:profiles!referrals_referee_id_fkey(full_name,email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to load referrals.')
    }

    return ((data ?? []) as ReferralRow[]).map(mapReferral)
  },

  async getReferralForReferee(profileId: string): Promise<ReferralWithProfiles | null> {
    const sb = requireSupabase()
    const { data, error } = await sb
      .from('referrals')
      .select(`
        *,
        referrer:profiles!referrals_referrer_id_fkey(full_name,email),
        referee:profiles!referrals_referee_id_fkey(full_name,email)
      `)
      .eq('referee_id', profileId)
      .maybeSingle()

    if (error) {
      throw new Error('Failed to load referral status.')
    }

    return data ? mapReferral(data as ReferralRow) : null
  },

  async approveReferral(referralId: string, approverId: string): Promise<void> {
    const sb = requireSupabase()
    const { data: referral, error: updateError } = await sb
      .from('referrals')
      .update({
        status: 'approved',
        approved_by: approverId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', referralId)
      .eq('status', 'pending')
      .select('referrer_id, referee_id, business_id')
      .single()

    if (updateError || !referral) {
      throw new Error('Referral is not pending or could not be approved.')
    }

    const referrerId = referral.referrer_id as string
    const refereeId = referral.referee_id as string
    const businessId = (referral.business_id as string | null) ?? null

    await incrementAvailableCredit(referrerId)
    await incrementAvailableCredit(refereeId)

    const { error: activityError } = await sb.from('activities').insert([
      {
        profile_id: referrerId,
        business_id: businessId,
        type: 'bonus',
        title: 'Referral credit awarded',
        points: 0,
        status: 'posted',
      },
      {
        profile_id: refereeId,
        business_id: businessId,
        type: 'bonus',
        title: 'Referral credit awarded',
        points: 0,
        status: 'posted',
      },
    ])

    if (activityError) {
      throw new Error(activityError.message)
    }
  },

  async rejectReferral(referralId: string): Promise<void> {
    const sb = requireSupabase()
    const { error } = await sb
      .from('referrals')
      .update({ status: 'rejected' })
      .eq('id', referralId)
      .eq('status', 'pending')

    if (error) {
      throw new Error(error.message)
    }
  },

  async useCredit(profileId: string, actorName: string): Promise<void> {
    const sb = requireSupabase()
    const { data: balance, error: balanceError } = await sb
      .from('reward_balances')
      .select('available_credits')
      .eq('profile_id', profileId)
      .single()

    if (balanceError || !balance) {
      throw new Error('Balance not found.')
    }

    const availableCredits = Number(balance.available_credits ?? 0)
    if (availableCredits <= 0) {
      throw new Error('No coffee credits are available for this member.')
    }

    const { error: updateError } = await sb
      .from('reward_balances')
      .update({ available_credits: availableCredits - 1 })
      .eq('profile_id', profileId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    const { error: activityError } = await sb.from('activities').insert({
      profile_id: profileId,
      type: 'adjustment',
      title: 'Coffee credit used',
      points: 0,
      status: 'posted',
    })

    if (activityError) {
      throw new Error(activityError.message)
    }

    const { error: logError } = await sb.from('admin_logs').insert({
      actor_name: actorName,
      action: 'Coffee credit used',
      details: `Used 1 coffee credit for member ${profileId}.`,
    })

    if (logError) {
      console.error('Admin log error:', logError)
    }
  },
}
