import type { Business } from '@/types/domain'
import type { BusinessSettingsFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'

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
    return data.map((row) => camelCaseRow(row) as unknown as Business)
  },

  async getSingleBusiness(): Promise<Business> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('businesses')
      .select('*')
      .eq('active', true)
      .limit(1)
      .single()

    if (error || !data) {
      throw new Error('No business configured.')
    }

    return camelCaseRow(data) as unknown as Business
  },

  async getBusinessById(businessId: string): Promise<Business | null> {
    const sb = requireSupabase()

    const { data, error } = await sb
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single()

    if (error || !data) return null
    return camelCaseRow(data) as unknown as Business
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
      details: `Updated earn rate ${values.earnRate} pts/$1, tax rate ${(values.taxRate * 100).toFixed(2)}%.`,
    })

    return camelCaseRow(data) as unknown as Business
  },
}
