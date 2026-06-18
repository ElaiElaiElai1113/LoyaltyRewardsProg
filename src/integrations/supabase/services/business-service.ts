import type { Business } from '@/types/domain'
import type { BusinessSettingsFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj, toNullableNumber } from './shared'

function normalizeBusiness(row: Record<string, unknown>): Business {
  const business = camelCaseRow(row) as unknown as Business
  return {
    ...business,
    address: business.address ?? '',
    latitude: toNullableNumber(business.latitude),
    longitude: toNullableNumber(business.longitude),
    rewardRatePercent: Number(business.rewardRatePercent ?? 20),
    commissionRatePercent: Number(business.commissionRatePercent ?? 10),
  }
}

export const businessService = {
  async getBusinesses(includeInactive = false): Promise<Business[]> {
    const sb = requireSupabase()

    let query = sb
      .from('businesses')
      .select('*')

    if (!includeInactive) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

    if (error) throw new Error('Failed to load businesses.')
    return data.map((row) => normalizeBusiness(row as Record<string, unknown>))
  },

  async getSingleBusiness(businessId?: string): Promise<Business> {
    const sb = requireSupabase()

    let query = sb
      .from('businesses')
      .select('*')
      .eq('active', true)

    if (businessId) {
      query = query.eq('id', businessId)
    } else {
      query = query.limit(1)
    }

    const { data, error } = await query.single()

    if (error || !data) {
      throw new Error('No business configured.')
    }

    return normalizeBusiness(data as Record<string, unknown>)
  },

  async getBusinessById(businessId: string): Promise<Business | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (error || !data) return null
    return normalizeBusiness(data as Record<string, unknown>)
  },

  async updateSettings(businessId: string, values: BusinessSettingsFormValues): Promise<Business> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)

    const { data, error } = await sb
      .from('businesses')
      .update(snakeValues)
      .eq('id', businessId)
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to update business settings.')
    }

    // Log the change
    await sb.from('admin_logs').insert({
      actor_name: 'Business Owner',
      action: 'Business settings updated',
      details: `Updated earn rate ${values.earnRate} pts/$1, reward rate ${values.rewardRatePercent}%, commission ${values.commissionRatePercent}%, tax rate ${(values.taxRate * 100).toFixed(2)}%.`,
    })

    return normalizeBusiness(data as Record<string, unknown>)
  },

  async updateOwnerSettings(values: BusinessSettingsFormValues): Promise<Business> {
    const sb = requireSupabase()

    const { data, error } = await sb.rpc('update_owner_business_settings', {
      p_earn_rate: values.earnRate,
      p_reward_rate_percent: values.rewardRatePercent,
      p_commission_rate_percent: values.commissionRatePercent,
      p_tax_rate: values.taxRate,
    })

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to update business settings.')
    }

    return normalizeBusiness(data as Record<string, unknown>)
  },
}
