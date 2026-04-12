import type { Promotion } from '@/types/domain'
import type { PromotionDraftFormValues } from '@/types/forms'
import { requireSupabase, camelCaseRow, snakeCaseObj } from './shared'

export const promotionsService = {
  async getPromotions(businessId?: string): Promise<Promotion[]> {
    const sb = requireSupabase()

    let query = sb.from('promotions').select('*')
    if (businessId) {
      query = query.eq('business_id', businessId)
    }

    const { data, error } = await query
    if (error) throw new Error('Failed to load promotions.')

    return (data as Record<string, unknown>[])
      .map((row) => camelCaseRow(row) as unknown as Promotion)
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
  },

  async createPromotion(values: PromotionDraftFormValues & { businessId: string }): Promise<Promotion> {
    const sb = requireSupabase()

    const snakeValues = snakeCaseObj(values as unknown as Record<string, unknown>)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()

    const { data, error } = await sb
      .from('promotions')
      .insert({ ...snakeValues, expires_at: expiresAt })
      .select('*')
      .single()

    if (error || !data) {
      throw new Error('Failed to create promotion.')
    }

    const promotion = camelCaseRow(data) as unknown as Promotion

    await sb.from('admin_logs').insert({
      actor_name: 'Business Owner',
      action: 'Promotion created',
      details: `Created ${promotion.title}.`,
    })

    return promotion
  },
}
